const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const logAction = async (action, resource, userId, tenantId = null, resourceId = null, oldData = null, newData = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        resource,
        resourceId,
        userId,
        tenantId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null
      }
    });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const tenantId = req.tenant?.id || null;
        const resourceId = req.params?.id || null;

        if (userId) {
          setImmediate(() => {
            logAction(
              action,
              resource,
              userId,
              tenantId,
              resourceId,
              req.originalData || null,
              action === 'DELETE' ? null : (typeof data === 'string' ? JSON.parse(data) : data)
            );
          });
        }
      }

      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  logAction,
  auditMiddleware
};