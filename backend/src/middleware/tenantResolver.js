import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Resolves tenant from custom domain or subdomain in request host header.
 * Checks custom domain first, then falls back to subdomain extraction.
 * Read-only middleware - does not modify database state.
 */
const MAIN_DOMAINS = ['shopu.ge', 'momigvare.ge', 'localhost', '127.0.0.1'];

const tenantResolver = async (req, res, next) => {
  try {
    let host = req.get('x-original-host') || req.get('host');

    if (!host) {
      return res.status(400).json({ error: 'Host header is required' });
    }

    host = host.split(':')[0].toLowerCase();

    // Step 0: Path-based tenant resolution (shopu.ge/:slug/dashboard)
    const tenantSlug = req.get('x-tenant-slug');
    if (tenantSlug && MAIN_DOMAINS.includes(host)) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain: tenantSlug },
        include: {
          owner: { select: { id: true, email: true, role: true } },
          subscription: true
        }
      });
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found', subdomain: tenantSlug });
      }
      if (req.requireActiveTenant !== true) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
        return next();
      }
      if (!tenant.isActive) {
        return res.status(403).json({
          error: 'Store is currently inactive',
          subdomain: tenantSlug,
          isActive: false
        });
      }
      const subscription = tenant.subscription;
      if (subscription) {
        const now = new Date();
        const periodEnd = new Date(subscription.currentPeriodEnd);
        if (subscription.status === 'CANCELLED' && periodEnd < now) {
          req.subscriptionWarning = { expired: true, periodEnd: periodEnd.toISOString() };
        } else if (subscription.status === 'CANCELLED') {
          req.subscriptionWarning = {
            cancelled: true,
            periodEnd: periodEnd.toISOString(),
            daysRemaining: Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24))
          };
        }
      }
      req.tenant = tenant;
      req.tenantId = tenant.id;
      return next();
    }

    // Step 1: Check if host matches a custom domain (exact match or www variant)
    const tenantByCustomDomain = await prisma.tenant.findFirst({
      where: {
        OR: [
          { customDomain: host },
          { customDomain: `www.${host}` },
          { customDomain: host.replace(/^www\./, '') }
        ],
        customDomain: { not: null }
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        subscription: true
      }
    });

    if (tenantByCustomDomain) {
      // Found tenant by custom domain - continue with existing logic
      const tenant = tenantByCustomDomain;
      
      // For admin routes, allow access even if tenant is inactive or has no subscription
      if (req.requireActiveTenant !== true) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
        return next();
      }

      // Storefront route - only require active tenant
      if (!tenant.isActive) {
        return res.status(403).json({
          error: 'Store is currently inactive',
          customDomain: tenant.customDomain,
          isActive: false
        });
      }

      // Handle subscription warnings (same as subdomain logic)
      const subscription = tenant.subscription;
      if (subscription) {
        const now = new Date();
        const periodEnd = new Date(subscription.currentPeriodEnd);

        if (subscription.status === 'CANCELLED' && periodEnd < now) {
          req.subscriptionWarning = {
            expired: true,
            periodEnd: periodEnd.toISOString()
          };
        } else if (subscription.status === 'CANCELLED') {
          const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
          req.subscriptionWarning = {
            cancelled: true,
            periodEnd: periodEnd.toISOString(),
            daysRemaining
          };
        }
      }

      req.tenant = tenant;
      req.tenantId = tenant.id;
      return next();
    }

    // Step 2: Fall back to subdomain extraction (existing logic)
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

    // For admin routes, allow access even if tenant is inactive or has no subscription
    // This allows users to access dashboard to pay setup fee
    // Storefront routes use storefrontTenantResolver which requires active tenant + subscription
    
    // Check if this is a storefront route (by checking if req.requireActiveTenant is set)
    // If not set, it's an admin route - allow access even without subscription
    if (req.requireActiveTenant !== true) {
      // Admin route - allow access even if inactive or no subscription
      req.tenant = tenant;
      req.tenantId = tenant.id;
      return next();
    }

    // Storefront route - only require active tenant (not subscription)
    // This allows old tenants that are active but don't have subscriptions yet
    if (!tenant.isActive) {
      return res.status(403).json({
        error: 'Store is currently inactive',
        subdomain,
        isActive: false
      });
    }

    // For storefront, we only check if tenant is active
    // Subscription is optional for legacy tenants
    // If subscription exists, we can add warnings but don't block access
    const subscription = tenant.subscription;

    if (subscription) {
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);

      if (subscription.status === 'CANCELLED' && periodEnd < now) {
        // Subscription expired but tenant is still active - allow access
        // (legacy tenant scenario)
        req.subscriptionWarning = {
          expired: true,
          periodEnd: periodEnd.toISOString()
        };
      } else if (subscription.status === 'CANCELLED') {
        const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
        req.subscriptionWarning = {
          cancelled: true,
          periodEnd: periodEnd.toISOString(),
          daysRemaining
        };
      }
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
