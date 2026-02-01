import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class SubscriptionRepository extends BaseRepository {
  constructor() {
    super(prisma.subscription);
  }

  async findByTenantId(tenantId, options = {}) {
    // Use direct Prisma query to ensure it works correctly
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
      
      // Debug logging
      if (!result) {
        console.log(`[SubscriptionRepository] No subscription found for tenantId: ${tenantId}`);
        // Check if tenant exists
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { id: true, name: true, subdomain: true, isActive: true }
        });
        console.log(`[SubscriptionRepository] Tenant exists:`, tenant ? `Yes (isActive: ${tenant.isActive})` : 'No');
        
        // List all subscriptions to debug
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
