import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAIN_DOMAINS = ['shopu.ge', 'momigvare.ge', 'localhost', '127.0.0.1'];

const tenantInclude = {
  owner: { select: { id: true, email: true, role: true } },
  subscription: true,
};

/**
 * Applies storefront checks: tenant must be active and have valid subscription.
 * Returns a response sender if check fails, null if OK.
 */
function applyStorefrontChecks(req, tenant, errorContext) {
  if (!tenant.isActive) {
    return (response) => response.status(403).json({
      error: 'Store is currently inactive',
      ...errorContext,
      isActive: false,
    });
  }

  const subscription = tenant.subscription;
  if (!subscription) {
    return (response) => response.status(403).json({
      error: 'Subscription required. Please complete setup fee payment.',
      ...errorContext,
    });
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);

  if (subscription.status === 'CANCELLED' && periodEnd < now) {
    return (response) => response.status(403).json({
      error: 'Subscription has expired. Please renew to access the store.',
      ...errorContext,
    });
  }

  if (subscription.status === 'CANCELLED') {
    req.subscriptionWarning = {
      cancelled: true,
      periodEnd: periodEnd.toISOString(),
      daysRemaining: Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)),
    };
  }

  return null;
}

/**
 * Resolves tenant and attaches to req.tenant / req.tenantId.
 * Three resolution paths: X-Tenant-Slug (path-based), custom domain, subdomain.
 */
const tenantResolver = async (req, res, next) => {
  try {
    const host = (req.get('x-original-host') || req.get('host') || '')
      .split(':')[0]
      .toLowerCase()
      .replace(/^www\./, '');

    if (!host) {
      return res.status(400).json({ error: 'Host header is required' });
    }

    let tenant = null;

    // 1. Path-based (main domain): X-Tenant-Slug contains tenant ID
    const tenantIdFromPath = req.get('x-tenant-slug');
    if (tenantIdFromPath && MAIN_DOMAINS.includes(host)) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdFromPath },
        include: tenantInclude,
      });
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found', tenantId: tenantIdFromPath });
      }
    }

    // 2. Custom domain
    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { customDomain: host },
            { customDomain: `www.${host}` },
            { customDomain: host.replace(/^www\./, '') },
          ],
          customDomain: { not: null },
        },
        include: tenantInclude,
      });
    }

    // 3. Subdomain (e.g. mystore.shopu.ge, mystore.localhost)
    if (!tenant) {
      let subdomain = null;
      if (host.includes('localhost')) {
        const parts = host.split('.');
        subdomain = parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : null;
      } else {
        const parts = host.split('.');
        subdomain = parts.length > 2 ? parts[0] : null;
      }

      if (subdomain) {
        tenant = await prisma.tenant.findUnique({
          where: { subdomain },
          include: tenantInclude,
        });
        if (!tenant) {
          return res.status(404).json({ error: 'Tenant not found', subdomain });
        }
      }
    }

    if (!tenant) {
      req.tenant = null;
      return next();
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;

    // Admin/dashboard routes: allow access (user can pay setup fee, manage billing)
    if (req.requireActiveTenant !== true) {
      return next();
    }

    // Storefront: require active tenant + valid subscription
    const errorContext = tenant.customDomain
      ? { customDomain: tenant.customDomain }
      : { subdomain: tenant.subdomain, tenantId: tenant.id };

    const sendError = applyStorefrontChecks(req, tenant, errorContext);
    if (sendError) {
      return sendError(res);
    }

    next();
  } catch (error) {
    console.error('[tenantResolver] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default tenantResolver;
