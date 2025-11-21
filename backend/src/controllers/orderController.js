const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const orderController = {
  // Create order from cart (checkout)
  async createOrder(req, res) {
    try {
      const {
        sessionId,
        customerEmail,
        customerName,
        shippingAddress,
        billingAddress,
        notes
      } = req.body;
      const tenantId = req.tenantId;

      // Get cart with items
      const cart = await prisma.cart.findFirst({
        where: {
          sessionId,
          tenantId
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty or not found',
        });
      }

      // Validate stock for all items
      for (const item of cart.items) {
        const availableStock = item.variant ? item.variant.stockQuantity : item.product.stockQuantity;
        if (availableStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.product.title}`,
          });
        }
      }

      // Calculate total
      const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create order with transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            tenantId,
            customerEmail,
            customerName,
            totalAmount,
            shippingAddress,
            billingAddress,
            notes,
            status: 'PENDING',
            paymentStatus: 'PENDING',
          },
        });

        // Create order items
        for (const item of cart.items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              title: item.product.title,
              // Store variant options snapshot at time of order
              variantData: item.variant ? item.variant.options : null,
            },
          });

          // Update stock (variant stock takes priority if variant selected)
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // Clear cart items
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return newOrder;
      });

      // Mock payment processing - always succeeds
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      });


      const finalOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { sortOrder: 'asc' },
                    take: 1,
                  },
                },
              },
              variant: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: finalOrder,
        message: 'Order created successfully',
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message,
      });
    }
  },

  // Get orders (admin)
  async getOrders(req, res) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 10, status, search, dateFilter, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        tenantId
      };

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Handle date filtering
      if (dateFilter || (startDate && endDate)) {
        if (startDate && endDate) {
          // Custom date range
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          where.createdAt = {
            gte: start,
            lte: end,
          };
        } else if (dateFilter) {
          const now = new Date();
          let startOfPeriod, endOfPeriod;

          switch (dateFilter) {
            case 'today':
              startOfPeriod = new Date(now);
              startOfPeriod.setHours(0, 0, 0, 0);
              endOfPeriod = new Date(now);
              endOfPeriod.setHours(23, 59, 59, 999);
              break;
            case 'yesterday':
              startOfPeriod = new Date(now);
              startOfPeriod.setDate(now.getDate() - 1);
              startOfPeriod.setHours(0, 0, 0, 0);
              endOfPeriod = new Date(now);
              endOfPeriod.setDate(now.getDate() - 1);
              endOfPeriod.setHours(23, 59, 59, 999);
              break;
            case 'last7days':
              startOfPeriod = new Date(now);
              startOfPeriod.setDate(now.getDate() - 7);
              startOfPeriod.setHours(0, 0, 0, 0);
              endOfPeriod = new Date(now);
              endOfPeriod.setHours(23, 59, 59, 999);
              break;
            case 'last30days':
              startOfPeriod = new Date(now);
              startOfPeriod.setDate(now.getDate() - 30);
              startOfPeriod.setHours(0, 0, 0, 0);
              endOfPeriod = new Date(now);
              endOfPeriod.setHours(23, 59, 59, 999);
              break;
            case 'thisMonth':
              startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
              endOfPeriod = new Date(now);
              endOfPeriod.setHours(23, 59, 59, 999);
              break;
          }

          if (startOfPeriod && endOfPeriod) {
            where.createdAt = {
              gte: startOfPeriod,
              lte: endOfPeriod,
            };
          }
        }
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
                variant: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: parseInt(limit),
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
        error: error.message,
      });
    }
  },

  // Get single order
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const order = await prisma.order.findFirst({
        where: {
          id,
          tenantId
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { sortOrder: 'asc' },
                    take: 1,
                  },
                },
              },
              variant: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order',
        error: error.message,
      });
    }
  },

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const tenantId = req.tenantId;

      // Validate status
      const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status',
        });
      }

      const existingOrder = await prisma.order.findFirst({
        where: {
          id,
          tenantId
        },
      });

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });


      res.json({
        success: true,
        data: updatedOrder,
        message: 'Order status updated successfully',
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: error.message,
      });
    }
  },

  // Get order statistics for dashboard
  async getOrderStats(req, res) {
    try {
      const tenantId = req.tenantId;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const [
        totalOrders,
        monthlyOrders,
        weeklyOrders,
        monthlyRevenue,
        recentOrders,
        ordersByStatus,
      ] = await Promise.all([
        prisma.order.count({
          where: { tenantId },
        }),
        prisma.order.count({
          where: {
            tenantId,
            createdAt: { gte: startOfMonth },
          },
        }),
        prisma.order.count({
          where: {
            tenantId,
            createdAt: { gte: startOfWeek },
          },
        }),
        prisma.order.aggregate({
          where: {
            tenantId,
            paymentStatus: 'PAID',
            createdAt: { gte: startOfMonth },
          },
          _sum: { totalAmount: true },
        }),
        prisma.order.findMany({
          where: { tenantId },
          include: {
            items: {
              select: {
                quantity: true,
                product: {
                  select: { title: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.order.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: { status: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalOrders,
          monthlyOrders,
          weeklyOrders,
          monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
          recentOrders,
          ordersByStatus,
        },
      });
    } catch (error) {
      console.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order statistics',
        error: error.message,
      });
    }
  },
};

module.exports = orderController;