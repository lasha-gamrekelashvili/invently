import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';
import { categoryIncludes } from '../utils/queryBuilders.js';

export class CategoryRepository extends BaseRepository {
  constructor() {
    super(prisma.category);
  }

  async findByTenant(tenantId, options = {}) {
    return await this.findMany({ tenantId }, options);
  }

  async findByIdAndTenant(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId }, options);
  }

  async findBySlugAndTenant(slug, tenantId, options = {}) {
    return await this.findFirst({ slug, tenantId }, options);
  }

  async findWithChildren(categoryId, tenantId) {
    return await this.findFirst(
      { id: categoryId, tenantId },
      categoryIncludes.withChildren
    );
  }

  async findWithProducts(categoryId, tenantId) {
    return await this.findFirst(
      { id: categoryId, tenantId },
      categoryIncludes.withProducts
    );
  }

  async findWithCounts(tenantId, where = {}, paginationOptions = {}) {
    return await this.findMany(
      { tenantId, ...where },
      {
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              products: {
                where: {
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
        ...paginationOptions,
      }
    );
  }

  async createCategory(data, tenantId) {
    return await this.create({
      ...data,
      tenantId,
    });
  }

  async updateCategory(id, data) {
    return await this.update(id, data);
  }

  async deleteCategory(id) {
    return await this.delete(id);
  }

  async countByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, ...where });
  }

  async paginateByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, ...where }, page, limit, options);
  }
}
