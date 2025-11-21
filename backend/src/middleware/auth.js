const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        ownedTenants: {
          where: {
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requirePlatformAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  next();
};

const requireStoreOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'PLATFORM_ADMIN') {
    return next();
  }

  if (req.user.role === 'STORE_OWNER' && req.tenant) {
    const isOwner = req.user.ownedTenants.some(tenant => tenant.id === req.tenant.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied: not the store owner' });
    }
    return next();
  }

  return res.status(403).json({ error: 'Store owner access required' });
};

module.exports = {
  authenticateToken,
  requirePlatformAdmin,
  requireStoreOwner
};