import crypto from 'crypto';
import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository.js';
import { BOGPaymentService } from './BOGPaymentService.js';
import prisma from '../repositories/BaseRepository.js';
import { PRICING, calculateBillingPeriod } from '../config/pricing.js';

export class PaymentService {
  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    this.bogPayment = process.env.BOG_CLIENT_ID && process.env.BOG_CLIENT_SECRET
      ? new BOGPaymentService()
      : null;
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
   * Initiates a BOG payment for a billing payment (setup fee, subscription).
   * Creates a BOG order and returns the redirect URL for the user.
   */
  async initiateBOGPayment(paymentId) {
    if (!this.bogPayment) {
      throw new Error('Payment gateway is not configured. Please contact support.');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, email: true } },
        tenant: { select: { id: true, subdomain: true, customDomain: true } },
      },
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'PAID') return { payment, redirectUrl: null };
    if (payment.status === 'FAILED') {
      throw new Error('Payment already failed. Please create a new payment.');
    }

    const backendBase = (process.env.BACKEND_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const callbackUrl = `${backendBase}/api/bog/callback`;

    const platformBase = (process.env.PLATFORM_FRONTEND_URL || 'https://shopu.ge').replace(/\/$/, '');
    const tenantSlug = payment.tenant?.subdomain || '';
    const successUrl = `${platformBase}/${tenantSlug}/payment/${paymentId}?bog=success`;
    const failUrl = `${platformBase}/${tenantSlug}/payment/${paymentId}?bog=fail`;

    const description = payment.type === 'SETUP_FEE' ? 'Store Setup Fee' : 'Monthly Subscription';

    const bogResult = await this.bogPayment.createOrder({
      callbackUrl,
      externalOrderId: `pay_${paymentId}`,
      totalAmount: payment.amount,
      basket: [{
        productId: payment.type,
        description,
        quantity: 1,
        unitPrice: payment.amount,
      }],
      customerName: payment.user?.email?.split('@')[0] || 'Customer',
      customerEmail: payment.user?.email || '',
      successUrl,
      failUrl,
      idempotencyKey: crypto.randomUUID(),
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
          bogOrderId: bogResult.bogOrderId,
          initiatedAt: new Date().toISOString(),
        },
      },
    });

    return { payment, redirectUrl: bogResult.redirectUrl };
  }

  /**
   * Finalizes a billing payment after successful BOG callback.
   * Marks payment as PAID and handles side effects (tenant activation, subscription).
   */
  async finalizeBillingPayment(paymentId, transactionInfo = {}) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });

      if (!payment) throw new Error('Payment not found');

      const alreadyPaid = payment.status === 'PAID';

      if (!alreadyPaid) {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            transactionId: transactionInfo.orderId || transactionInfo.bogOrderId || null,
            metadata: {
              ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
              processedAt: new Date().toISOString(),
              bogEvent: transactionInfo.event || null,
              bogStatus: transactionInfo.status || null,
            },
          },
        });
      }

      if (payment.type === 'SETUP_FEE') {
        await tx.tenant.update({
          where: { id: payment.tenantId },
          data: { isActive: true },
        });

        const existingSubscription = await tx.subscription.findUnique({
          where: { tenantId: payment.tenantId },
        });

        if (!existingSubscription) {
          const { periodStart, periodEnd, nextBillingDate } = calculateBillingPeriod();
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

      return await tx.payment.findUnique({ where: { id: paymentId } });
    }, {
      isolationLevel: 'Serializable',
      timeout: 30000,
    });
  }

  /**
   * Marks a billing payment as failed (called from BOG callback on rejection).
   */
  async markBillingPaymentFailed(paymentId, failureInfo = {}) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status === 'PAID' || payment.status === 'FAILED') return payment;

    return await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        metadata: {
          ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
          failedAt: new Date().toISOString(),
          bogRejectReason: failureInfo.rejectReason || null,
          bogPaymentCode: failureInfo.code || null,
        },
      },
    });
  }

  /**
   * Checks BOG directly for a billing payment's status and finalizes if completed.
   * Used when BOG callback can't reach us (e.g. localhost) or as a fallback.
   */
  async verifyPaymentWithBOG(paymentId) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'FAILED') return payment;

    // If PAID, ensure side effects (subscription) were completed
    if (payment.status === 'PAID') {
      if (payment.type === 'SETUP_FEE') {
        const sub = await prisma.subscription.findUnique({ where: { tenantId: payment.tenantId } });
        if (!sub) {
          await this.finalizeBillingPayment(paymentId, { event: 'recover' });
          return await prisma.payment.findUnique({ where: { id: paymentId } });
        }
      }
      return payment;
    }

    const bogOrderId = payment.metadata?.bogOrderId;
    if (!bogOrderId || !this.bogPayment) return payment;

    try {
      const details = await this.bogPayment.getPaymentDetails(bogOrderId);
      if (!details) return payment;

      const statusKey = details.order_status?.key;

      if (statusKey === 'completed') {
        return await this.finalizeBillingPayment(paymentId, {
          orderId: bogOrderId,
          status: statusKey,
          event: 'verify_poll',
        });
      }

      if (statusKey === 'rejected') {
        return await this.markBillingPaymentFailed(paymentId, {
          rejectReason: details.reject_reason ?? null,
          code: details.payment_detail?.code ?? null,
        });
      }

      return payment;
    } catch (err) {
      console.warn('[verifyPaymentWithBOG] BOG API error', { paymentId, err: err.message });
      return payment;
    }
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
