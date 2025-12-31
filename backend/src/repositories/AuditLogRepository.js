import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class AuditLogRepository extends BaseRepository {
  constructor() {
    super(prisma.auditLog);
  }

  async findWithRelations(where = {}, options = {}) {
    return await this.findMany(
      where,
      {
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
        orderBy: { createdAt: 'desc' },
        ...options,
      }
    );
  }

  async paginateWithRelations(where = {}, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.findWithRelations(where, {
        skip,
        take: limit,
      }),
      this.count(where),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async createLog(data) {
    return await this.create(data);
  }
}
