import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tenantResolver = async (req, res, next) => {
  try {
    // Check for X-Original-Host header first (for cross-domain deployments)
    // This allows frontend on shopu.ge to communicate with backend on momigvare.onrender.com
    let host = req.get('x-original-host') || req.get('host');

    if (!host) {
      return res.status(400).json({ error: 'Host header is required' });
    }

    // Remove port if present
    host = host.split(':')[0];

    // Handle localhost subdomains (e.g., shopname.localhost:3000)
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
      // Handle production subdomains (e.g., shopname.example.com or shopname.shopu.ge)
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

    // First, try to find active tenant
    let tenant = await prisma.tenant.findUnique({
      where: {
        subdomain,
        isActive: true
      },
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

    // If not found, check for inactive tenant (might have expired subscription)
    if (!tenant) {
      tenant = await prisma.tenant.findUnique({
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
        console.log(`[tenantResolver] Tenant ${subdomain} not found`);
        return res.status(404).json({
          error: 'Tenant not found',
          subdomain
        });
      }

      // If tenant is inactive, check if subscription is expired (allow reactivation)
      if (!tenant.isActive && tenant.subscription && tenant.subscription.status === 'EXPIRED') {
        // Allow access for reactivation - set tenant and continue
        console.log(`[tenantResolver] Tenant ${subdomain} is inactive with expired subscription. Allowing access for reactivation.`);
        req.tenant = tenant;
        req.tenantId = tenant.id;
        return next();
      }

      // Tenant is inactive but not expired - block access
      console.log(`[tenantResolver] Tenant ${subdomain} exists but is inactive (isActive: ${tenant.isActive})`);
      return res.status(404).json({
        error: 'Tenant not found or inactive',
        subdomain,
        isActive: false
      });
    }

    // Check if tenant has a subscription (required for all tenants)
    if (!tenant.subscription) {
      // Old tenant without subscription - require setup fee payment
      console.log(`[tenantResolver] Tenant ${subdomain} has no subscription. This is an old tenant that needs to pay setup fee.`);
      
      // Deactivate tenant to require payment
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { isActive: false }
      });

      return res.status(404).json({
        error: 'Subscription required. Please complete setup fee payment to activate your account.',
        subdomain,
        isActive: false,
        subscriptionRequired: true,
        needsSetupFee: true
      });
    }

    // Check subscription status for end-of-period cancellation
    const now = new Date();
    const subscription = tenant.subscription;

    // If subscription is cancelled and period has ended, deactivate tenant
    if (subscription.status === 'CANCELLED' && new Date(subscription.currentPeriodEnd) < now) {
      console.log(`[tenantResolver] Subscription cancelled and period ended for tenant ${subdomain}. Deactivating tenant.`);
      
      // Deactivate tenant
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { isActive: false }
      });

      // Update subscription status to EXPIRED
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' }
      });

      return res.status(404).json({
        error: 'Subscription has expired. Please renew your subscription to continue.',
        subdomain,
        isActive: false,
        subscriptionExpired: true
      });
    }

    // If subscription is cancelled but period hasn't ended, allow access
    // (end-of-period cancellation - user keeps access until period ends)
    if (subscription.status === 'CANCELLED') {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      console.log(`[tenantResolver] Subscription cancelled but period hasn't ended. Access until ${periodEnd.toISOString()}`);
      // Continue - allow access until period ends
    }

    // If subscription is not ACTIVE and not CANCELLED (e.g., EXPIRED), block access
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'CANCELLED') {
      console.log(`[tenantResolver] Tenant ${subdomain} has subscription status ${subscription.status}. Blocking access.`);
      return res.status(404).json({
        error: 'Subscription is not active. Please reactivate your subscription to continue.',
        subdomain,
        isActive: false,
        subscriptionStatus: subscription.status
      });
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;

    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default tenantResolver;