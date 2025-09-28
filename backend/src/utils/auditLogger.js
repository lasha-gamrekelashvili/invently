const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const logAction = async (action, resource, userId, tenantId = null, resourceId = null, oldData = null, newData = null, anonymousUserEmail = null, anonymousUserName = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        resource,
        resourceId,
        userId,
        tenantId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        anonymousUserEmail,
        anonymousUserName
      }
    });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    // For UPDATE actions, capture the original data before the operation
    if (action === 'UPDATE' && req.params?.id) {
      try {
        const resourceId = req.params.id;
        let originalData = null;

        // Fetch original data based on resource type
        switch (resource.toUpperCase()) {
          case 'PRODUCT':
            originalData = await prisma.product.findUnique({
              where: { id: resourceId },
              include: { category: true, images: true }
            });
            break;
          case 'CATEGORY':
            originalData = await prisma.category.findUnique({
              where: { id: resourceId }
            });
            break;
          case 'ORDER':
            originalData = await prisma.order.findUnique({
              where: { id: resourceId },
              include: { items: true }
            });
            break;
          default:
            // For other resources, try a generic approach
            try {
              const modelName = resource.toLowerCase();
              if (prisma[modelName]) {
                originalData = await prisma[modelName].findUnique({
                  where: { id: resourceId }
                });
              }
            } catch (error) {
              console.warn(`Could not fetch original data for resource: ${resource}`);
            }
        }

        req.originalData = originalData;
      } catch (error) {
        console.error('Error fetching original data for audit log:', error);
      }
    }

    const originalSend = res.send;

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const tenantId = req.tenantId || req.tenant?.id || null;
        const resourceId = req.params?.id || null;

        // Log for authenticated users OR for anonymous order creation
        if (userId || (action === 'CREATE' && resource === 'ORDER')) {
          const responseData = action === 'DELETE' ? null : (typeof data === 'string' ? JSON.parse(data) : data);

          // Extract anonymous user info for order creation
          let anonymousUserEmail = null;
          let anonymousUserName = null;

          if (!userId && action === 'CREATE' && resource === 'ORDER') {
            anonymousUserEmail = req.body?.customerEmail || responseData?.data?.customerEmail;
            anonymousUserName = req.body?.customerName || responseData?.data?.customerName;
          }

          setImmediate(() => {
            logAction(
              action,
              resource,
              userId,
              tenantId,
              resourceId,
              req.originalData || null,
              responseData,
              anonymousUserEmail,
              anonymousUserName
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