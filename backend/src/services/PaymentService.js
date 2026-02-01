import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository.js';
import prisma from '../repositories/BaseRepository.js';

export class PaymentService {
  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.subscriptionRepository = new SubscriptionRepository();
  }

  /**
   * Create a payment record
   */
  async createPayment(userId, tenantId, type, amount, paymentMethod = 'MOCK') {
    return await this.paymentRepository.create({
      userId,
      tenantId,
      type,
      amount,
      status: 'PENDING',
      paymentMethod,
    }, {});
  }

  /**
   * Process mock payment (always succeeds for now)
   * In production, this would integrate with a real payment gateway
   */
  async processMockPayment(paymentId, paymentData = {}) {
    const payment = await this.paymentRepository.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'PAID') {
      return payment; // Already processed
    }

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate potential payment failure (for testing - remove in production)
      // Uncomment the line below to test payment failure scenario
      // if (Math.random() < 0.1) throw new Error('Payment processing failed');

      // Update payment status to PAID
      const updatedPayment = await this.paymentRepository.update(paymentId, {
        status: 'PAID',
        transactionId: `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          processedAt: new Date().toISOString(),
          ...paymentData,
        },
      });

      // If this is a setup fee, activate tenant and create subscription
      // Only activate tenant AFTER successful payment
      if (payment.type === 'SETUP_FEE') {
        // Activate the tenant
        await prisma.tenant.update({
          where: { id: payment.tenantId },
          data: { isActive: true },
        });
        
        // Create subscription
        await this.createSubscription(payment.tenantId);
      }

      // If this is a monthly subscription, update subscription period
      if (payment.type === 'MONTHLY_SUBSCRIPTION') {
        await this.renewSubscription(payment.tenantId);
      }

      return updatedPayment;
    } catch (error) {
      // If payment processing fails, mark payment as failed
      // Tenant remains inactive
      await this.paymentRepository.update(paymentId, {
        status: 'FAILED',
        metadata: {
          error: error.message,
          failedAt: new Date().toISOString(),
        },
      });
      
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Create subscription for a tenant
   */
  async createSubscription(tenantId) {
    // Check if subscription already exists
    const existing = await this.subscriptionRepository.findByTenantId(tenantId);
    if (existing) {
      console.log(`Subscription already exists for tenant ${tenantId}`);
      return existing;
    }

    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const periodEnd = new Date(nextBillingDate);
    periodEnd.setDate(periodEnd.getDate() - 1);

    try {
      const subscription = await this.subscriptionRepository.create({
        tenantId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingDate,
      });
      console.log(`Successfully created subscription for tenant ${tenantId}`);
      return subscription;
    } catch (error) {
      // If unique constraint error, subscription was created by another process
      if (error.code === 'P2002') {
        console.log(`Subscription already exists (race condition) for tenant ${tenantId}`);
        return await this.subscriptionRepository.findByTenantId(tenantId);
      }
      throw error;
    }
  }

  /**
   * Renew subscription (extend period by 1 month)
   */
  async renewSubscription(tenantId) {
    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const now = new Date();
    const nextBillingDate = new Date(subscription.nextBillingDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const periodEnd = new Date(nextBillingDate);
    periodEnd.setDate(periodEnd.getDate() - 1);

    return await this.subscriptionRepository.update(subscription.id, {
      status: 'ACTIVE',
      currentPeriodStart: subscription.nextBillingDate,
      currentPeriodEnd: periodEnd,
      nextBillingDate,
      cancelledAt: null, // Reactivate if cancelled
    });
  }

  /**
   * Process monthly subscription charge
   */
  async processMonthlySubscription(tenantId) {
    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Don't charge if subscription is cancelled
    if (subscription.status === 'CANCELLED') {
      throw new Error('Subscription is cancelled. No further charges will be processed.');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new Error('Subscription is not active');
    }

    const now = new Date();
    if (now < subscription.nextBillingDate) {
      throw new Error('Subscription is not due for renewal yet');
    }

    // Get tenant owner
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { owner: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Create payment record
    const payment = await this.createPayment(
      tenant.ownerId,
      tenantId,
      'MONTHLY_SUBSCRIPTION',
      49.0
    );

    // Process payment (mock for now)
    await this.processMockPayment(payment.id);

    return payment;
  }

  /**
   * Cancel subscription
   * End-of-period cancellation: marks subscription as cancelled but keeps tenant active
   * until currentPeriodEnd. Tenant will be deactivated when period ends.
   */
  async cancelSubscription(tenantId) {
    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status === 'CANCELLED') {
      return subscription; // Already cancelled
    }

    // Mark as cancelled but keep tenant active until currentPeriodEnd
    // The tenant will be deactivated when the period ends (checked in tenantResolver)
    return await this.subscriptionRepository.update(subscription.id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      // Keep currentPeriodStart, currentPeriodEnd, nextBillingDate unchanged
      // Tenant remains active until currentPeriodEnd
    });
  }

  /**
   * Reactivate subscription
   * - If cancelled but period hasn't ended: Just reactivate without new payment (resume current period)
   * - If expired: Create new payment and start new period
   */
  async reactivateSubscription(tenantId) {
    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status === 'ACTIVE') {
      return subscription; // Already active
    }

    // Get tenant and owner
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { owner: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const isPeriodExpired = periodEnd < now;

    // If subscription is cancelled but period hasn't expired, just reactivate without new payment
    if (subscription.status === 'CANCELLED' && !isPeriodExpired) {
      // Resume current period - no new payment needed
      const reactivatedSubscription = await this.subscriptionRepository.update(subscription.id, {
        status: 'ACTIVE',
        cancelledAt: null, // Clear cancellation
        // Keep existing period dates
      });

      // Ensure tenant is active
      if (!tenant.isActive) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { isActive: true },
        });
      }

      return reactivatedSubscription;
    }

    // If subscription is expired or period has ended, create new payment and start new period
    // Create payment for monthly subscription
    const payment = await this.createPayment(
      tenant.ownerId,
      tenantId,
      'MONTHLY_SUBSCRIPTION',
      49.0
    );

    // Process payment
    await this.processMockPayment(payment.id);

    // Calculate new period dates
    const nextBillingDate = new Date(now);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const newPeriodEnd = new Date(nextBillingDate);
    newPeriodEnd.setDate(newPeriodEnd.getDate() - 1);

    // Reactivate subscription with new period
    const reactivatedSubscription = await this.subscriptionRepository.update(subscription.id, {
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: newPeriodEnd,
      nextBillingDate,
      cancelledAt: null, // Clear cancellation
    });

    // Activate tenant if it was inactive
    if (!tenant.isActive) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { isActive: true },
      });
    }

    return reactivatedSubscription;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId) {
    return await this.paymentRepository.findById(paymentId);
  }

  /**
   * Get payments for a user
   */
  async getUserPayments(userId, params = {}) {
    return await this.paymentRepository.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      ...params,
    });
  }

  /**
   * Get payments for a tenant
   */
  async getTenantPayments(tenantId, params = {}) {
    return await this.paymentRepository.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      ...params,
    });
  }
}
