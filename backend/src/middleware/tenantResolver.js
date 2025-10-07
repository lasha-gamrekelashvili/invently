const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const tenantResolver = async (req, res, next) => {
  try {
    // Check for X-Original-Host header first (for cross-domain deployments)
    // This allows frontend on momigvare.ge to communicate with backend on momigvare.onrender.com
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
      // Handle production subdomains (e.g., shopname.example.com or shopname.momigvare.ge)
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
      where: {
        subdomain,
        isActive: true,
        deletedAt: null
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
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        subdomain
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

module.exports = tenantResolver;