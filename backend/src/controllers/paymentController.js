import { PaymentService } from '../services/PaymentService.js';
import { ApiResponse } from '../utils/responseFormatter.js';
import prisma from '../repositories/BaseRepository.js';

const paymentService = new PaymentService();

/**
 * Initiates a BOG payment for a billing payment (setup fee, subscription).
 * Returns a redirect URL for the user to complete payment on BOG's page.
 */
const processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const existingPayment = await paymentService.getPaymentById(paymentId);

    if (!existingPayment) {
      return res.status(404).json(ApiResponse.error('Payment not found'));
    }

    if (existingPayment.userId !== req.user.id && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ApiResponse.error('Forbidden: You do not own this payment'));
    }

    if (existingPayment.status === 'PAID') {
      return res.json(ApiResponse.success(existingPayment, 'Payment already processed'));
    }

    const { redirectUrl } = await paymentService.initiateBOGPayment(paymentId);

    res.json(ApiResponse.success({ redirectUrl, paymentId }, 'Payment initiated — redirect to complete'));
  } catch (error) {
    if (error.message === 'Payment not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    if (error.message.includes('Payment already failed')) {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message.includes('not configured')) {
      return res.status(503).json(ApiResponse.error(error.message));
    }
    console.error('Process payment error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Verifies a payment's status directly with BOG.
 * Finalizes the payment if BOG reports it as completed.
 */
const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const existingPayment = await paymentService.getPaymentById(paymentId);

    if (!existingPayment) {
      return res.status(404).json(ApiResponse.error('Payment not found'));
    }

    if (existingPayment.userId !== req.user.id && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ApiResponse.error('Forbidden'));
    }

    const payment = await paymentService.verifyPaymentWithBOG(paymentId);
    res.json(ApiResponse.success(payment));
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets a payment by ID
 */
const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json(ApiResponse.notFound('Payment'));
    }

    if (payment.userId !== req.user.id && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ApiResponse.error('Forbidden'));
    }

    res.json(ApiResponse.success(payment));
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets all payments for the authenticated user
 */
const getUserPayments = async (req, res) => {
  try {
    const payments = await paymentService.getUserPayments(req.user.id);
    res.json(ApiResponse.success(payments));
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets or creates a pending setup fee payment for legacy tenants
 */
const getPendingSetupFee = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await paymentService.getUserPayments(userId);

    let pendingSetupFee = payments.find(
      p => p.type === 'SETUP_FEE' && p.status === 'PENDING'
    );

    if (!pendingSetupFee) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          ownedTenants: {
            include: { subscription: true }
          }
        }
      });

      if (user) {
        const tenantWithoutSubscription = user.ownedTenants.find(t => !t.subscription);

        if (tenantWithoutSubscription) {
          pendingSetupFee = await paymentService.createPayment(
            userId,
            tenantWithoutSubscription.id,
            'SETUP_FEE'
          );
        }
      }
    }

    if (!pendingSetupFee) {
      return res.status(404).json(ApiResponse.notFound('Pending setup fee payment'));
    }

    res.json(ApiResponse.success(pendingSetupFee));
  } catch (error) {
    console.error('Get pending setup fee error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets all payments for the current tenant
 */
const getTenantPayments = async (req, res) => {
  try {
    const payments = await paymentService.getTenantPayments(req.tenantId);
    res.json(ApiResponse.success(payments));
  } catch (error) {
    console.error('Get tenant payments error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets subscription for the current tenant, with recovery for missing subscriptions
 */
const getSubscription = async (req, res) => {
  try {
    let tenantId = req.tenantId;

    if (!tenantId) {
      // Check X-Tenant-Slug header (contains tenant ID, sent by frontend on path-based routing)
      const tenantIdFromHeader = req.get('x-tenant-slug');
      if (tenantIdFromHeader) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantIdFromHeader },
          include: { owner: { select: { id: true } } }
        });

        if (tenant && tenant.owner.id === req.user.id) {
          tenantId = tenant.id;
        } else if (tenant) {
          return res.status(403).json(ApiResponse.error('Forbidden'));
        }
      }
    }

    if (!tenantId) {
      return res.status(400).json(ApiResponse.error('Tenant ID is required'));
    }

    if (!req.tenantId) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { ownedTenants: { select: { id: true } } }
      });

      if (!user || !user.ownedTenants.some(t => t.id === tenantId)) {
        return res.status(403).json(ApiResponse.error('Forbidden'));
      }
    }

    let subscription = await paymentService.subscriptionRepository.findByTenantId(tenantId);

    if (!subscription) {
      subscription = await paymentService.recoverSubscription(tenantId, req.user.id);

      if (!subscription) {
        return res.status(404).json(ApiResponse.notFound('Subscription'));
      }
    }

    res.json(ApiResponse.success(subscription));
  } catch (error) {
    console.error('[getSubscription] Error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Cancels the current tenant's subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await paymentService.cancelSubscription(req.tenantId);
    res.json(ApiResponse.success(subscription, 'Subscription cancelled successfully'));
  } catch (error) {
    if (error.message === 'Subscription not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    console.error('Cancel subscription error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Reactivates the current tenant's subscription
 */
const reactivateSubscription = async (req, res) => {
  try {
    const subscription = await paymentService.reactivateSubscription(req.tenantId);
    res.json(ApiResponse.success(subscription, 'Subscription reactivated successfully'));
  } catch (error) {
    if (error.message === 'Subscription not found' || error.message === 'Tenant not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    console.error('Reactivate subscription error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export {
  processPayment,
  verifyPayment,
  getPayment,
  getUserPayments,
  getTenantPayments,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  getPendingSetupFee,
};
