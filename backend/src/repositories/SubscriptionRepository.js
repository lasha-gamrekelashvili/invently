import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class SubscriptionRepository extends BaseRepository {
  constructor() {
    super(prisma.subscription);
  }

  /**
   * Finds a subscription by tenant ID
   */
  async findByTenantId(tenantId, options = {}) {
    return await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            isActive: true,
          },
        },
      },
      ...options,
    });
  }

  /**
   * Finds active subscriptions due for renewal
   */
  async findActiveSubscriptions() {
    return await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: {
          lte: new Date(),
        },
      },
      include: {
        tenant: {
          include: {
            owner: true,
          },
        },
      },
    });
  }
}
