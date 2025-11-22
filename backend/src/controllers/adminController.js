import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllTenants = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', isActive } = req.query;

    const where = {
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { subdomain: { contains: search } },
          { owner: { email: { contains: search } } }
        ]
      })
    };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              categories: true,
              products: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.tenant.count({ where })
    ]);

    res.json({
      tenants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all tenants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        },
        categories: {
          include: {
            _count: {
              select: { products: true }
            }
          }
        },
        products: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            categories: true,
            products: true,
            productImages: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Get tenant by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { isActive },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });


    res.json(tenant);
  } catch (error) {
    console.error('Update tenant status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } }
        ]
      })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          ownedTenants: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              isActive: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, tenantId, userId, resource, action } = req.query;

    const where = {
      ...(tenantId && { tenantId }),
      ...(userId && { userId }),
      ...(resource && { resource }),
      ...(action && { action })
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalProducts,
      totalCategories,
      recentTenants
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.product.count(),
      prisma.category.count(),
      prisma.tenant.findMany({
        include: {
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      stats: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalProducts,
        totalCategories
      },
      recentTenants
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  getAllTenants,
  getTenantById,
  updateTenantStatus,
  getAllUsers,
  getAuditLogs,
  getSystemStats
};