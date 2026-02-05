import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class PaymentRepository extends BaseRepository {
  constructor() {
    super(prisma.payment);
  }

  /**
   * Finds a payment by ID with user and tenant relations
   */
  async findById(id, options = {}) {
    return await this.findFirst({ id }, {
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      ...options,
    });
  }

  /**
   * Finds a payment by tenant ID
   */
  async findByTenantId(tenantId, options = {}) {
    return await this.findFirst({ tenantId }, options);
  }

  async findMany(options = {}) {
    const { where = {}, orderBy = { createdAt: 'desc' }, include, ...rest } = options;
    
    return await this.prisma.payment.findMany({
      where,
      orderBy,
      include: include || {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      ...rest,
    });
  }
}
