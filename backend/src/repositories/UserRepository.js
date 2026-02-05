import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
  }

  /**
   * Finds a user by email
   */
  async findByEmail(email, options = {}) {
    return await this.findFirst({ email }, options);
  }

  /**
   * Finds users with their owned tenants
   */
  async findWithTenants(where = {}, options = {}) {
    return await this.findMany(
      where,
      {
        select: {
          id: true,
          email: true,
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

  /**
   * Paginates users with their owned tenants
   */
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
