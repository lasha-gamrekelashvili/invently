import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class TenantRepository extends BaseRepository {
  constructor() {
    super(prisma.tenant);
  }

  async findBySubdomain(subdomain, options = {}) {
    return await this.findFirst({ subdomain }, options);
  }

  async findByOwner(ownerId, options = {}) {
    return await this.findMany({ ownerId }, options);
  }

  async findActiveTenants(where = {}, options = {}) {
    return await this.findMany({ ...where, isActive: true }, options);
  }

  async findWithOwner(id, options = {}) {
    return await this.findFirst(
      { id },
      {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          ...options.include,
        },
        ...options,
      }
    );
  }

  async findWithStats(id) {
    return await this.findFirst(
      { id },
      {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
          categories: {
            include: {
              _count: {
                select: { products: true },
              },
            },
          },
          products: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              categories: true,
              products: true,
              productImages: true,
            },
          },
        },
      }
    );
  }

  async paginateWithOwner(where = {}, page = 1, limit = 20, options = {}) {
    return await this.paginate(
      where,
      page,
      limit,
      {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              categories: true,
              products: true,
            },
          },
        },
        ...options,
      }
    );
  }

  async updateTenantStatus(id, isActive) {
    return await this.update(id, { isActive });
  }
}
