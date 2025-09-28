const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auditLogController = {
  // Get audit logs for tenant
  async getAuditLogs(req, res) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 50, action, resource, userId, search, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        tenantId,
      };

      // Add filters if provided
      if (action) {
        where.action = action;
      }

      if (resource) {
        where.resource = resource;
      }

      if (userId) {
        where.userId = userId;
      }

      if (search) {
        where.OR = [
          { action: { contains: search, mode: 'insensitive' } },
          { resource: { contains: search, mode: 'insensitive' } },
          { resourceId: { contains: search, mode: 'insensitive' } },
          { anonymousUserEmail: { contains: search, mode: 'insensitive' } },
          { anonymousUserName: { contains: search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }

      // Add date filters if provided
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          // Add one day to endDate to include the entire end date
          const endDateTime = new Date(endDate);
          endDateTime.setDate(endDateTime.getDate() + 1);
          where.createdAt.lt = endDateTime;
        }
      }

      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: parseInt(limit),
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit logs',
        error: error.message,
      });
    }
  },

  // Get audit log statistics
  async getAuditLogStats(req, res) {
    try {
      const tenantId = req.tenantId;
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalLogs,
        logsLast7Days,
        logsLast30Days,
        logsByAction,
        logsByResource,
        recentUsers,
      ] = await Promise.all([
        prisma.auditLog.count({
          where: { tenantId },
        }),
        prisma.auditLog.count({
          where: {
            tenantId,
            createdAt: { gte: last7Days },
          },
        }),
        prisma.auditLog.count({
          where: {
            tenantId,
            createdAt: { gte: last30Days },
          },
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where: { tenantId },
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
        }),
        prisma.auditLog.groupBy({
          by: ['resource'],
          where: { tenantId },
          _count: { resource: true },
          orderBy: { _count: { resource: 'desc' } },
        }),
        prisma.auditLog.findMany({
          where: {
            tenantId,
            createdAt: { gte: last7Days },
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalLogs,
          logsLast7Days,
          logsLast30Days,
          logsByAction,
          logsByResource,
          recentUsers,
        },
      });
    } catch (error) {
      console.error('Get audit log stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit log statistics',
        error: error.message,
      });
    }
  },
};

module.exports = auditLogController;