import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository.js';
import prisma from '../repositories/BaseRepository.js';
import { PRICING, calculateBillingPeriod } from '../config/pricing.js';

export class PaymentService {
  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.subscriptionRepository = new SubscriptionRepository();
  }

  /**
   * Creates a payment record with PENDING status
   */
  async createPayment(userId, tenantId, type, amount = null, paymentMethod = 'MOCK') {
    const finalAmount = amount ?? (type === 'SETUP_FEE' ? PRICING.SETUP_FEE : PRICING.MONTHLY_SUBSCRIPTION);

    return await this.paymentRepository.create({
      userId,
      tenantId,
      type,
      amount: finalAmount,
      status: 'PENDING',
      paymentMethod,
    }, {});
  }

  /**
   * Processes a payment with transaction safety and idempotency.
   * For SETUP_FEE: activates tenant and creates subscription.
   * For MONTHLY_SUBSCRIPTION: renews the subscription period.
   */
  async processMockPayment(paymentId, paymentData = {}) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'PAID') {
        return payment;
      }

      if (payment.status === 'FAILED') {
        throw new Error('Payment already failed. Please create a new payment.');
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const transactionId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            transactionId,
            metadata: {
              processedAt: new Date().toISOString(),
              ...paymentData,
            },
          },
        });

        if (payment.type === 'SETUP_FEE') {
          await tx.tenant.update({
            where: { id: payment.tenantId },
            data: { isActive: true },
          });

          const { periodStart, periodEnd, nextBillingDate } = calculateBillingPeriod();

          const existingSubscription = await tx.subscription.findUnique({
            where: { tenantId: payment.tenantId },
          });

          if (!existingSubscription) {
            await tx.subscription.create({
              data: {
                tenantId: payment.tenantId,
                status: 'ACTIVE',
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                nextBillingDate,
              },
            });
          }
        }

        if (payment.type === 'MONTHLY_SUBSCRIPTION') {
          await this.renewSubscriptionInTransaction(tx, payment.tenantId);
        }

        return updatedPayment;

      } catch (error) {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'FAILED',
            metadata: {
              error: error.message,
              failedAt: new Date().toISOString(),
            },
          },
        });

        throw new Error(`Payment processing failed: ${error.message}`);
      }
    }, {
      isolationLevel: 'Serializable',
      timeout: 30000,
    });
  }

  /**
   * Renews subscription within a transaction.
   * Starts from today if expired, otherwise extends from nextBillingDate.
   */
  async renewSubscriptionInTransaction(tx, tenantId) {
    const subscription = await tx.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const now = new Date();
    const oldNextBillingDate = new Date(subscription.nextBillingDate);
    const newPeriodStart = oldNextBillingDate < now ? now : oldNextBillingDate;
    const { periodEnd, nextBillingDate } = calculateBillingPeriod(newPeriodStart);

    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: periodEnd,
        nextBillingDate,
        cancelledAt: null,
      },
    });
  }

  /**
   * Creates a subscription for a tenant (standalone, for recovery scenarios)
   */
  async createSubscription(tenantId) {
    const existing = await this.subscriptionRepository.findByTenantId(tenantId);
    if (existing) {
      return existing;
    }

    const { periodStart, periodEnd, nextBillingDate } = calculateBillingPeriod();

    try {
      return await this.subscriptionRepository.create({
        tenantId,
        status: 'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        nextBillingDate,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return await this.subscriptionRepository.findByTenantId(tenantId);
      }
      throw error;
    }
  }

  /**
   * Renews subscription by extending the period by 1 month.
   * Starts from today if expired, otherwise extends from nextBillingDate.
   */
  async renewSubscription(tenantId) {
    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const now = new Date();
    const oldNextBillingDate = new Date(subscription.nextBillingDate);
    const newPeriodStart = oldNextBillingDate < now ? now : oldNextBillingDate;
    const { periodEnd, nextBillingDate } = calculateBillingPeriod(newPeriodStart);

    return await this.subscriptionRepository.update(subscription.id, {
      status: 'ACTIVE',
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: periodEnd,
      nextBillingDate,
      cancelledAt: null,
    });
  }

  /**
   * Processes a monthly subscription charge for a tenant
   */
  async processMonthlySubscription(tenantId) {
    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

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

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { owner: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const payment = await this.createPayment(
      tenant.ownerId,
      tenantId,
      'MONTHLY_SUBSCRIPTION',
      PRICING.MONTHLY_SUBSCRIPTION
    );

    await this.processMockPayment(payment.id);

    return payment;
  }

  /**
   * Cancels subscription with end-of-period cancellation.
   * Tenant remains active until currentPeriodEnd.
   */
  async cancelSubscription(tenantId) {
    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status === 'CANCELLED') {
      return subscription;
    }

    return await this.subscriptionRepository.update(subscription.id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    });
  }

  /**
   * Reactivates a cancelled or expired subscription.
   * If cancelled but period not ended: resumes without payment.
   * If expired: creates new payment and starts new period.
   */
  async reactivateSubscription(tenantId) {
    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status === 'ACTIVE') {
      return subscription;
    }

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

    // Resume without payment if still within period
    if (subscription.status === 'CANCELLED' && !isPeriodExpired) {
      const reactivatedSubscription = await this.subscriptionRepository.update(subscription.id, {
        status: 'ACTIVE',
        cancelledAt: null,
      });

      if (!tenant.isActive) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { isActive: true },
        });
      }

      return reactivatedSubscription;
    }

    // Expired: require new payment
    const payment = await this.createPayment(
      tenant.ownerId,
      tenantId,
      'MONTHLY_SUBSCRIPTION',
      PRICING.MONTHLY_SUBSCRIPTION
    );

    await this.processMockPayment(payment.id);

    const updatedSubscription = await this.subscriptionRepository.findByTenantId(tenantId);

    if (!tenant.isActive) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { isActive: true },
      });
    }

    return updatedSubscription;
  }

  /**
   * Handles subscription expiry by deactivating tenant and marking subscription as expired.
   * Called by scheduled job for cancelled subscriptions past their period end.
   */
  async handleSubscriptionExpiry(tenantId) {
    return await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({
        where: { tenantId },
      });

      if (!subscription) {
        return null;
      }

      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);

      if (subscription.status === 'CANCELLED' && periodEnd < now) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: { isActive: false },
        });

        return await tx.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        });
      }

      return subscription;
    });
  }

  /**
   * Recovers a missing subscription for a tenant that paid setup fee.
   * Handles edge case where subscription creation failed after payment.
   */
  async recoverSubscription(tenantId, userId) {
    const existingSubscription = await this.subscriptionRepository.findByTenantId(tenantId);
    if (existingSubscription) {
      return existingSubscription;
    }

    const payments = await this.paymentRepository.findMany({
      where: {
        tenantId,
        userId,
        type: 'SETUP_FEE',
        status: 'PAID',
      },
    });

    if (payments.length === 0) {
      return null;
    }

    return await prisma.$transaction(async (tx) => {
      const { periodStart, periodEnd, nextBillingDate } = calculateBillingPeriod();

      const checkAgain = await tx.subscription.findUnique({
        where: { tenantId },
      });

      if (checkAgain) {
        return checkAgain;
      }

      const subscription = await tx.subscription.create({
        data: {
          tenantId,
          status: 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          nextBillingDate,
        },
      });

      await tx.tenant.update({
        where: { id: tenantId },
        data: { isActive: true },
      });

      return subscription;
    });
  }

  /**
   * Gets a payment by ID
   */
  async getPaymentById(paymentId) {
    return await this.paymentRepository.findById(paymentId);
  }

  /**
   * Gets all payments for a user
   */
  async getUserPayments(userId, params = {}) {
    return await this.paymentRepository.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      ...params,
    });
  }

  /**
   * Gets all payments for a tenant
   */
  async getTenantPayments(tenantId, params = {}) {
    return await this.paymentRepository.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      ...params,
    });
  }
}
