import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';
import { orderIncludes } from '../utils/queryBuilders.js';

export class OrderRepository extends BaseRepository {
  constructor() {
    super(prisma.order);
  }

  async findByTenant(tenantId, options = {}) {
    return await this.findMany({ tenantId }, options);
  }

  async findByIdAndTenant(id, tenantId, includeItems = true) {
    const options = includeItems ? orderIncludes.full : {};
    return await this.findFirst({ id, tenantId }, options);
  }

  async createOrder(orderData) {
    return await this.create(orderData);
  }

  async updateOrderStatus(id, status) {
    return await this.update(id, { status });
  }

  async updatePaymentStatus(id, paymentStatus) {
    return await this.update(id, { paymentStatus });
  }

  async paginateByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, ...where }, page, limit, options);
  }

  // Statistics methods
  async countOrders(where = {}) {
    return await this.count(where);
  }

  async aggregateRevenue(where = {}) {
    return await prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
    });
  }

  async groupByStatus(tenantId) {
    return await prisma.order.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    });
  }

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

  async findByOrder(orderId) {
    return await this.findMany({ orderId });
  }
}
