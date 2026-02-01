import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class PaymentRepository extends BaseRepository {
  constructor() {
    super(prisma.payment);
  }

  async findById(id, options = {}) {
    return await this.findFirst({ id }, {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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
            firstName: true,
            lastName: true,
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
