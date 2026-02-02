import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Resolves tenant from subdomain in request host header.
 * Read-only middleware - does not modify database state.
 */
const tenantResolver = async (req, res, next) => {
  try {
    let host = req.get('x-original-host') || req.get('host');

    if (!host) {
      return res.status(400).json({ error: 'Host header is required' });
    }

    host = host.split(':')[0];

    let subdomain;
    if (host.includes('localhost')) {
      const parts = host.split('.');
      if (parts.length > 1 && parts[0] !== 'localhost') {
        subdomain = parts[0];
      } else {
        req.tenant = null;
        return next();
      }
    } else {
      const parts = host.split('.');
      if (parts.length > 2) {
        subdomain = parts[0];
      } else {
        req.tenant = null;
        return next();
      }
    }

    if (!subdomain) {
      req.tenant = null;
      return next();
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        subscription: true
      }
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        subdomain
      });
    }

    if (!tenant.isActive) {
      if (tenant.subscription && tenant.subscription.status === 'EXPIRED') {
        return res.status(403).json({
          error: 'Subscription has expired. Please renew your subscription to continue.',
          subdomain,
          isActive: false,
          subscriptionExpired: true,
          canReactivate: true
        });
      }

      if (!tenant.subscription) {
        return res.status(403).json({
          error: 'Subscription required. Please complete setup fee payment to activate your account.',
          subdomain,
          isActive: false,
          subscriptionRequired: true,
          needsSetupFee: true
        });
      }

      return res.status(403).json({
        error: 'Store is currently inactive',
        subdomain,
        isActive: false
      });
    }

    const subscription = tenant.subscription;

    if (!subscription) {
      return res.status(403).json({
        error: 'Subscription required. Please complete setup fee payment.',
        subdomain,
        isActive: true,
        subscriptionRequired: true,
        needsSetupFee: true
      });
    }

    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);

    if (subscription.status === 'CANCELLED' && periodEnd < now) {
      return res.status(403).json({
        error: 'Subscription has expired. Please renew your subscription to continue.',
        subdomain,
        isActive: true,
        subscriptionExpired: true,
        canReactivate: true
      });
    }

    if (subscription.status === 'CANCELLED') {
      const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
      req.subscriptionWarning = {
        cancelled: true,
        periodEnd: periodEnd.toISOString(),
        daysRemaining
      };
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'CANCELLED') {
      return res.status(403).json({
        error: 'Subscription is not active. Please reactivate your subscription to continue.',
        subdomain,
        isActive: false,
        subscriptionStatus: subscription.status,
        canReactivate: subscription.status === 'EXPIRED'
      });
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;

    next();
  } catch (error) {
    console.error('[tenantResolver] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default tenantResolver;
