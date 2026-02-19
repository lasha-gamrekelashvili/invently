import { OrderRepository, OrderItemRepository } from '../repositories/OrderRepository.js';
import { CartRepository } from '../repositories/CartRepository.js';
import prisma from '../repositories/BaseRepository.js';
import { EmailService } from './EmailService.js';

export class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.orderItemRepository = new OrderItemRepository();
    this.cartRepository = new CartRepository();
    this.emailService = new EmailService();
  }

  /**
   * Generates a unique order number
   */
  generateOrderNumber() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Calculates order total from cart items
   */
  calculateOrderTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Validates stock availability for all cart items
   */
  validateCartStock(cartItems) {
    for (const item of cartItems) {
      const availableStock = item.variant ? item.variant.stockQuantity : item.product.stockQuantity;
      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.title}`);
      }
    }
    return true;
  }

  /**
   * Validates that all cart items are available (not deleted/inactive)
   */
  validateCartItemsAvailable(cartItems) {
    const unavailableItems = [];

    for (const item of cartItems) {
      const product = item.product;

      if (!product) {
        unavailableItems.push({ title: 'Unknown product', reason: 'Product no longer exists' });
        continue;
      }

      if (product.isDeleted) {
        unavailableItems.push({ title: product.title, reason: 'has been deleted' });
        continue;
      }

      if (!product.isActive) {
        unavailableItems.push({ title: product.title, reason: 'is no longer available' });
        continue;
      }
    }

    if (unavailableItems.length > 0) {
      const itemsList = unavailableItems.map(i => `"${i.title}" ${i.reason}`).join(', ');
      throw new Error(`Cannot checkout: ${itemsList}. Please remove unavailable items from your cart.`);
    }

    return true;
  }

  /**
   * Creates an order from cart (checkout)
   */
  async createOrder(orderData, tenantId) {
    const { sessionId, customerEmail, customerName, shippingAddress, billingAddress, notes } = orderData;

    const cart = await this.cartRepository.getCartWithItems(sessionId, tenantId);

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty or not found');
    }

    this.validateCartItemsAvailable(cart.items);
    this.validateCartStock(cart.items);

    const totalAmount = this.calculateOrderTotal(cart.items);
    const orderNumber = this.generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
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

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    await this.orderRepository.update(order.id, {
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    });

    const finalOrder = await this.orderRepository.findFirst(
      { id: order.id },
      {
        include: {
          tenant: {
            include: {
              owner: { select: { email: true } },
            },
          },
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                },
              },
              variant: true,
            },
          },
        },
      }
    );

    const ownerEmail = finalOrder.tenant?.owner?.email;
    if (ownerEmail) {
      const tenant = finalOrder.tenant;
      const subdomain = tenant?.subdomain;
      const customDomain = tenant?.customDomain;
      const frontendBaseUrl = (process.env.FRONTEND_BASE_URL || 'https://shopu.ge').replace(/\/$/, '');
      const dashboardOrderUrl = this.buildDashboardOrderUrl(frontendBaseUrl, subdomain, customDomain, finalOrder.id);
      try {
        await this.emailService.sendOrderNotificationToOwner({
          email: ownerEmail,
          customerName: finalOrder.customerName,
          orderNumber: finalOrder.orderNumber,
          items: finalOrder.items || [],
          totalAmount: finalOrder.totalAmount,
          dashboardOrderUrl,
        });
      } catch (error) {
        console.error('Order confirmation email failed:', error);
      }
    } else {
      console.warn('Order confirmation email skipped: store owner email missing.');
    }

    try {
      await this.emailService.sendOrderConfirmation({
        email: finalOrder.customerEmail,
        customerName: finalOrder.customerName,
        orderNumber: finalOrder.orderNumber,
        items: finalOrder.items || [],
        totalAmount: finalOrder.totalAmount,
      });
    } catch (error) {
      console.error('Customer order confirmation email failed:', error);
    }

    return finalOrder;
  }

  buildDashboardOrderUrl(frontendBaseUrl, subdomain, customDomain, orderId) {
    if (!frontendBaseUrl) return null;
    const isLocalhost = frontendBaseUrl.includes('localhost');
    // Dashboard is now path-based: shopu.ge/:subdomain/orders/:id
    if (subdomain) {
      return `${frontendBaseUrl.replace(/\/$/, '')}/${subdomain}/orders/${orderId}`;
    }
    return null;
  }

  /**
   * Builds date filter based on filter type or custom range
   */
  buildDateFilter(dateFilter, startDate, endDate) {
    const now = new Date();

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return { gte: start, lte: end };
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
      return { gte: startOfPeriod, lte: endOfPeriod };
    }

    return null;
  }

  /**
   * Gets orders with filtering and pagination
   */
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

    const dateRange = this.buildDateFilter(dateFilter, startDate, endDate);
    if (dateRange) {
      where.createdAt = dateRange;
    }

    const options = {
      include: {
        items: {
          include: {
            product: { select: { id: true, title: true, slug: true } },
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

  /**
   * Gets a single order by ID
   */
  async getOrder(id, tenantId) {
    const order = await this.orderRepository.findByIdAndTenant(id, tenantId, true);

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Updates order status
   */
  async updateOrderStatus(id, status, tenantId) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const existingOrder = await this.orderRepository.findByIdAndTenant(id, tenantId, false);

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    await this.orderRepository.update(id, { status });

    return await this.orderRepository.findFirst(
      { id },
      {
        include: {
          items: {
            include: { product: true, variant: true },
          },
        },
      }
    );
  }

  /**
   * Gets order statistics for dashboard
   */
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
      this.orderRepository.countOrders({ tenantId, createdAt: { gte: startOfMonth } }),
      this.orderRepository.countOrders({ tenantId, createdAt: { gte: startOfWeek } }),
      this.orderRepository.aggregateRevenue({ tenantId, paymentStatus: 'PAID', createdAt: { gte: startOfMonth } }),
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
