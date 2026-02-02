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
    try {
      const result = await this.prisma.subscription.findFirst({
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
      
      if (!result) {
        console.log(`[SubscriptionRepository] No subscription found for tenantId: ${tenantId}`);
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { id: true, name: true, subdomain: true, isActive: true }
        });
        console.log(`[SubscriptionRepository] Tenant exists:`, tenant ? `Yes (isActive: ${tenant.isActive})` : 'No');
        
        const allSubs = await this.prisma.subscription.findMany({
          select: { id: true, tenantId: true, status: true },
        });
        console.log(`[SubscriptionRepository] All subscriptions in DB:`, JSON.stringify(allSubs, null, 2));
      }
      
      return result;
    } catch (error) {
      console.error(`[SubscriptionRepository] Error finding subscription for tenantId ${tenantId}:`, error);
      throw error;
    }
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
