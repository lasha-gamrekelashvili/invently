import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email, options = {}) {
    return await this.findFirst({ email }, options);
  }

  async findWithTenants(where = {}, options = {}) {
    return await this.findMany(
      where,
      {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          ownedTenants: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              isActive: true,
            },
          },
        },
        ...options,
      }
    );
  }

  async paginateWithTenants(where = {}, page = 1, limit = 20, options = {}) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.findWithTenants(where, {
        skip,
        take: limit,
        ...options,
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
}
