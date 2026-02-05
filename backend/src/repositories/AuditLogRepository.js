import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class AuditLogRepository extends BaseRepository {
  constructor() {
    super(prisma.auditLog);
  }

  /**
   * Finds audit logs with user and tenant relations
   */
  async findWithRelations(where = {}, options = {}) {
    return await this.findMany(
      where,
      {
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
        orderBy: { createdAt: 'desc' },
        ...options,
      }
    );
  }

  /**
   * Paginates audit logs with relations
   */
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

  /**
   * Creates an audit log entry
   */
  async createLog(data) {
    return await this.create(data);
  }
}
