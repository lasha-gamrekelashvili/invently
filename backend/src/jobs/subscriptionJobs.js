import prisma from '../repositories/BaseRepository.js';
import { PaymentService } from '../services/PaymentService.js';
import { SUBSCRIPTION_GRACE_PERIOD_DAYS } from '../config/pricing.js';

const paymentService = new PaymentService();

/**
 * Finds ACTIVE subscriptions where the billing period has ended without payment.
 * Marks them as CANCELLED so they enter the grace period, then eventually expiry.
 */
async function processLapsedSubscriptions() {
  const now = new Date();

  try {
    const lapsedSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: now },
      },
      include: {
        tenant: {
          select: { id: true, subdomain: true },
        },
      },
    });

    if (lapsedSubscriptions.length === 0) {
      return { processed: 0, errors: [] };
    }

    const errors = [];
    let processed = 0;

    for (const subscription of lapsedSubscriptions) {
      try {
        await paymentService.markSubscriptionLapsed(subscription.tenantId);
        processed++;
      } catch (error) {
        errors.push({
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          error: error.message,
        });
      }
    }

    return { processed, errors };
  } catch (error) {
    console.error('[SubscriptionJob] processLapsedSubscriptions error:', error);
    throw error;
  }
}

/**
 * Finds cancelled subscriptions past the grace period (period end + grace days).
 * Only these are deactivated; during grace period the store remains accessible.
 */
async function processExpiredSubscriptions() {
  const now = new Date();
  const graceCutoff = new Date(now);
  graceCutoff.setDate(graceCutoff.getDate() - SUBSCRIPTION_GRACE_PERIOD_DAYS);

  try {
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'CANCELLED',
        currentPeriodEnd: { lt: graceCutoff },
      },
      include: {
        tenant: {
          select: {
            id: true,
            subdomain: true,
            isActive: true,
          },
        },
      },
    });

    if (expiredSubscriptions.length === 0) {
      return { processed: 0, errors: [] };
    }

    const errors = [];
    let processed = 0;

    for (const subscription of expiredSubscriptions) {
      try {
        await paymentService.handleSubscriptionExpiry(subscription.tenantId);
        processed++;
      } catch (error) {
        errors.push({
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          error: error.message,
        });
      }
    }

    return { processed, errors };
  } catch (error) {
    console.error('[SubscriptionJob] Error:', error);
    throw error;
  }
}

/**
 * Runs both lapsed and expiry jobs. Lapsed first (ACTIVE→CANCELLED), then expired (CANCELLED→EXPIRED).
 */
async function runSubscriptionJobs() {
  try {
    const lapsedResult = await processLapsedSubscriptions();
    if (lapsedResult.processed > 0) {
      console.log(`[SubscriptionJob] Marked ${lapsedResult.processed} lapsed subscriptions (ACTIVE→CANCELLED)`);
    }
    const expiredResult = await processExpiredSubscriptions();
    if (expiredResult.processed > 0) {
      console.log(`[SubscriptionJob] Processed ${expiredResult.processed} expired subscriptions`);
    }
  } catch (error) {
    console.error('[SubscriptionJob] Job failed:', error);
    throw error;
  }
}

/**
 * Starts the subscription job on an interval (lapsed + expiry)
 */
function startSubscriptionExpiryJob(intervalMs = 60 * 60 * 1000) {
  runSubscriptionJobs().catch(error => {
    console.error('[SubscriptionJob] Initial run failed:', error);
  });

  const intervalId = setInterval(runSubscriptionJobs, intervalMs);

  intervalId.unref();

  return intervalId;
}

/**
 * Stops the subscription expiry job
 */
function stopSubscriptionExpiryJob(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('[SubscriptionJob] Stopped');
  }
}

export {
  processLapsedSubscriptions,
  processExpiredSubscriptions,
  runSubscriptionJobs,
  startSubscriptionExpiryJob,
  stopSubscriptionExpiryJob,
};
