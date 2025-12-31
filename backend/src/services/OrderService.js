import { OrderRepository, OrderItemRepository } from '../repositories/OrderRepository.js';
import { CartRepository } from '../repositories/CartRepository.js';
import prisma from '../repositories/BaseRepository.js';

export class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.orderItemRepository = new OrderItemRepository();
    this.cartRepository = new CartRepository();
  }

  // Generate unique order number
  generateOrderNumber() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Calculate order total
  calculateOrderTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // Validate stock for all cart items
  validateCartStock(cartItems) {
    for (const item of cartItems) {
      const availableStock = item.variant ? item.variant.stockQuantity : item.product.stockQuantity;
      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.title}`);
      }
    }
    return true;
  }

  // Create order from cart (checkout)
  async createOrder(orderData, tenantId) {
    const { sessionId, customerEmail, customerName, shippingAddress, billingAddress, notes } = orderData;

    // Get cart with items
    const cart = await this.cartRepository.getCartWithItems(sessionId, tenantId);

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty or not found');
    }

    // Validate stock for all items
    this.validateCartStock(cart.items);

    // Calculate total
    const totalAmount = this.calculateOrderTotal(cart.items);

    // Generate order number
    const orderNumber = this.generateOrderNumber();

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

      // Create order items and update stock
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            title: item.product.title,
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
    await this.orderRepository.update(order.id, {
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    });

    // Fetch final order with all details
    const finalOrder = await this.orderRepository.findFirst(
      { id: order.id },
      {
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
      }
    );

    return finalOrder;
  }

  // Build date filter based on filter type or custom range
  buildDateFilter(dateFilter, startDate, endDate) {
    const now = new Date();

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return {
        gte: start,
        lte: end,
      };
    }

    if (!dateFilter) return null;

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
      default:
        return null;
    }

    if (startOfPeriod && endOfPeriod) {
      return {
        gte: startOfPeriod,
        lte: endOfPeriod,
      };
    }

    return null;
  }

  // Get orders with filtering and pagination
  async getOrders(tenantId, filters = {}, page = 1, limit = 10) {
    const { status, search, dateFilter, startDate, endDate } = filters;

    const where = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle date filtering
    const dateRange = this.buildDateFilter(dateFilter, startDate, endDate);
    if (dateRange) {
      where.createdAt = dateRange;
    }

    const options = {
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
    };

    const result = await this.orderRepository.paginateByTenant(tenantId, where, page, limit, options);

    return {
      orders: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }

  // Get single order
  async getOrder(id, tenantId) {
    const order = await this.orderRepository.findByIdAndTenant(id, tenantId, true);

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  // Update order status
  async updateOrderStatus(id, status, tenantId) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const existingOrder = await this.orderRepository.findByIdAndTenant(id, tenantId, false);

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const updatedOrder = await this.orderRepository.update(id, { status });

    // Fetch with full details
    return await this.orderRepository.findFirst(
      { id },
      {
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      }
    );
  }

  // Get order statistics for dashboard
  async getOrderStats(tenantId) {
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
      this.orderRepository.countOrders({ tenantId }),
      this.orderRepository.countOrders({
        tenantId,
        createdAt: { gte: startOfMonth },
      }),
      this.orderRepository.countOrders({
        tenantId,
        createdAt: { gte: startOfWeek },
      }),
      this.orderRepository.aggregateRevenue({
        tenantId,
        paymentStatus: 'PAID',
        createdAt: { gte: startOfMonth },
      }),
      this.orderRepository.getRecentOrders(tenantId, 5),
      this.orderRepository.groupByStatus(tenantId),
    ]);

    return {
      totalOrders,
      monthlyOrders,
      weeklyOrders,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      recentOrders,
      ordersByStatus,
    };
  }
}
