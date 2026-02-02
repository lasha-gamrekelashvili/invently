import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';
import { orderIncludes } from '../utils/queryBuilders.js';

export class OrderRepository extends BaseRepository {
  constructor() {
    super(prisma.order);
  }

  /**
   * Finds orders by tenant ID
   */
  async findByTenant(tenantId, options = {}) {
    return await this.findMany({ tenantId }, options);
  }

  /**
   * Finds an order by ID and tenant ID
   */
  async findByIdAndTenant(id, tenantId, includeItems = true) {
    const options = includeItems ? orderIncludes.full : {};
    return await this.findFirst({ id, tenantId }, options);
  }

  /**
   * Creates a new order
   */
  async createOrder(orderData) {
    return await this.create(orderData);
  }

  /**
   * Updates order status
   */
  async updateOrderStatus(id, status) {
    return await this.update(id, { status });
  }

  /**
   * Updates payment status
   */
  async updatePaymentStatus(id, paymentStatus) {
    return await this.update(id, { paymentStatus });
  }

  /**
   * Paginates orders by tenant ID
   */
  async paginateByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, ...where }, page, limit, options);
  }

  /**
   * Counts orders matching the where clause
   */
  async countOrders(where = {}) {
    return await this.count(where);
  }

  /**
   * Aggregates revenue from orders
   */
  async aggregateRevenue(where = {}) {
    return await prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
    });
  }

  /**
   * Groups orders by status
   */
  async groupByStatus(tenantId) {
    return await prisma.order.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    });
  }

  /**
   * Gets recent orders for a tenant
   */
  async getRecentOrders(tenantId, limit = 5) {
    return await this.findMany(
      { tenantId },
      {
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
        take: limit,
      }
    );
  }
}

export class OrderItemRepository extends BaseRepository {
  constructor() {
    super(prisma.orderItem);
  }

  async createOrderItem(orderItemData) {
    return await this.create(orderItemData);
  }

  /**
   * Finds order items by order ID
   */
  async findByOrder(orderId) {
    return await this.findMany({ orderId });
  }
}
