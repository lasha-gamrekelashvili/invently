import { PaymentService } from '../services/PaymentService.js';
import { ApiResponse } from '../utils/responseFormatter.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const paymentService = new PaymentService();

const processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentData = req.validatedData || {};

    const payment = await paymentService.processMockPayment(paymentId, paymentData);

    res.json(
      ApiResponse.success(
        payment,
        'Payment processed successfully'
      )
    );
  } catch (error) {
    if (error.message === 'Payment not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    console.error('Process payment error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json(ApiResponse.notFound('Payment'));
    }

    // Check if user has access to this payment
    if (payment.userId !== req.user.id && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ApiResponse.error('Forbidden'));
    }

    res.json(ApiResponse.success(payment));
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await paymentService.getUserPayments(userId);

    res.json(ApiResponse.success(payments));
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getPendingSetupFee = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await paymentService.getUserPayments(userId);
    
    // Find pending setup fee payment
    let pendingSetupFee = payments.find(
      p => p.type === 'SETUP_FEE' && p.status === 'PENDING'
    );

    // If no pending payment, check if user has any tenants without subscriptions (old tenants)
    if (!pendingSetupFee) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          ownedTenants: {
            include: {
              subscription: true
            }
          }
        }
      });

      if (user) {
        // Find tenant without subscription (old tenant that needs setup fee)
        const tenantWithoutSubscription = user.ownedTenants.find(t => !t.subscription);
        
        if (tenantWithoutSubscription) {
          console.log(`[getPendingSetupFee] Found old tenant ${tenantWithoutSubscription.subdomain} without subscription. Creating setup fee payment.`);
          
          // Create setup fee payment for old tenant
          pendingSetupFee = await paymentService.createPayment(
            userId,
            tenantWithoutSubscription.id,
            'SETUP_FEE',
            1.0
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

const getTenantPayments = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const payments = await paymentService.getTenantPayments(tenantId);

    res.json(ApiResponse.success(payments));
  } catch (error) {
    console.error('Get tenant payments error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getSubscription = async (req, res) => {
  try {
    // Get tenantId from req.tenantId (if tenantResolver ran) or find it from subdomain
    let tenantId = req.tenantId;
    
    if (!tenantId) {
      // Try to get tenant from subdomain (for recovery cases where tenantResolver didn't run)
      const host = req.get('x-original-host') || req.get('host');
      if (host) {
        const hostname = host.split(':')[0];
        let subdomain = '';
        
        if (hostname.includes('localhost')) {
          const parts = hostname.split('.');
          if (parts.length > 1 && parts[0] !== 'localhost') {
            subdomain = parts[0];
          }
        } else {
          const parts = hostname.split('.');
          if (parts.length > 2) {
            subdomain = parts[0];
          }
        }
        
        if (subdomain) {
          // Find tenant by subdomain (even if inactive) - verify user owns it
          const tenant = await prisma.tenant.findUnique({
            where: { subdomain },
            include: {
              owner: {
                select: { id: true }
              }
            }
          });
          
          if (tenant && tenant.owner.id === req.user.id) {
            tenantId = tenant.id;
            console.log(`[getSubscription] Found tenant ${tenantId} from subdomain ${subdomain}`);
          } else if (tenant) {
            return res.status(403).json(ApiResponse.error('Forbidden'));
          }
        }
      }
    }
    
    if (!tenantId) {
      console.log('[getSubscription] No tenantId found');
      return res.status(400).json(ApiResponse.error('Tenant ID is required'));
    }

    // Verify user owns this tenant (if not already verified above)
    if (!req.tenantId) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          ownedTenants: {
            select: { id: true }
          }
        }
      });

      if (!user || !user.ownedTenants.some(t => t.id === tenantId)) {
        return res.status(403).json(ApiResponse.error('Forbidden'));
      }
    }

    console.log(`[getSubscription] Looking for subscription for tenantId: ${tenantId}`);
    
    // Use the repository method which should work correctly
    let subscription = await paymentService.subscriptionRepository.findByTenantId(tenantId);
    
    console.log(`[getSubscription] Repository query result:`, subscription ? `Found subscription ${subscription.id} with status ${subscription.status}` : 'Not found');

    if (!subscription) {
      // Check if there's a paid setup fee - if so, subscription should exist
      console.log(`[getSubscription] No subscription found, checking for paid setup fee...`);
      
      // Get payments for this tenant (using user payments as fallback)
      let payments = [];
      try {
        payments = await paymentService.getTenantPayments(tenantId);
      } catch (error) {
        // If tenant payments fail (e.g., tenant inactive), try user payments
        console.log(`[getSubscription] Tenant payments failed, trying user payments...`);
        const userPayments = await paymentService.getUserPayments(req.user.id);
        payments = userPayments.filter(p => p.tenantId === tenantId);
      }
      
      const paidSetupFee = payments.find(p => p.type === 'SETUP_FEE' && p.status === 'PAID');
      
      console.log(`[getSubscription] Payments found:`, payments.length);
      console.log(`[getSubscription] Paid setup fee:`, paidSetupFee ? 'Yes' : 'No');
      
      if (paidSetupFee) {
        // Setup fee was paid but subscription doesn't exist - create it now
        console.log(`[getSubscription] Creating missing subscription for tenant ${tenantId} (setup fee was paid)`);
        try {
          subscription = await paymentService.createSubscription(tenantId);
          
          // Activate tenant if it was inactive
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { isActive: true }
          });
          
          console.log(`[getSubscription] Successfully created subscription for tenant ${tenantId} and activated tenant`);
          return res.json(ApiResponse.success(subscription));
        } catch (createError) {
          // Check if subscription was created by another request (race condition)
          subscription = await paymentService.subscriptionRepository.findByTenantId(tenantId);
          if (subscription) {
            console.log(`[getSubscription] Subscription found after race condition check`);
            return res.json(ApiResponse.success(subscription));
          }
          
          console.error('[getSubscription] Failed to create subscription recovery:', createError);
          // Still return 404 but with more context
          return res.status(404).json(ApiResponse.error('Subscription not found. Setup fee was paid but subscription creation failed. Please contact support.'));
        }
      }
      
      console.log(`[getSubscription] No subscription found for tenant ${tenantId} and no paid setup fee`);
      return res.status(404).json(ApiResponse.notFound('Subscription'));
    }

    console.log(`[getSubscription] Returning subscription for tenant ${tenantId}`);
    res.json(ApiResponse.success(subscription));
  } catch (error) {
    console.error('[getSubscription] Error:', error);
    console.error('[getSubscription] Error stack:', error.stack);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const subscription = await paymentService.cancelSubscription(tenantId);

    res.json(
      ApiResponse.success(
        subscription,
        'Subscription cancelled successfully'
      )
    );
  } catch (error) {
    if (error.message === 'Subscription not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    console.error('Cancel subscription error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const reactivateSubscription = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const subscription = await paymentService.reactivateSubscription(tenantId);

    res.json(
      ApiResponse.success(
        subscription,
        'Subscription reactivated successfully'
      )
    );
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
  getPayment,
  getUserPayments,
  getTenantPayments,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  getPendingSetupFee,
};
