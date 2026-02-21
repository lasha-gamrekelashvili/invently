import prisma from '../repositories/BaseRepository.js';
import { PaymentService } from '../services/PaymentService.js';

const paymentService = new PaymentService();

/**
 * Finds and processes all cancelled subscriptions where the period has ended
 */
async function processExpiredSubscriptions() {
  const now = new Date();

  try {
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'CANCELLED',
        currentPeriodEnd: { lt: now },
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
 * Starts the subscription expiry job on an interval
 */
function startSubscriptionExpiryJob(intervalMs = 60 * 60 * 1000) {
  processExpiredSubscriptions().catch(error => {
    console.error('[SubscriptionJob] Initial run failed:', error);
  });

  const intervalId = setInterval(async () => {
    try {
      const result = await processExpiredSubscriptions();
      if (result.processed > 0) {
        console.log(`[SubscriptionJob] Processed ${result.processed} expired subscriptions`);
      }
    } catch (error) {
      console.error('[SubscriptionJob] Job failed:', error);
    }
  }, intervalMs);

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
  processExpiredSubscriptions,
  startSubscriptionExpiryJob,
  stopSubscriptionExpiryJob,
};
