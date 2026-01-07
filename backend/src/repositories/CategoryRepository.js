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

  // Find active (non-deleted) category by ID and tenant
  async findActiveByIdAndTenant(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId, isDeleted: false }, options);
  }

  async findBySlugAndTenant(slug, tenantId, options = {}) {
    return await this.findFirst({ slug, tenantId, isDeleted: false }, options);
  }

  // Check if slug already exists among active (non-deleted) categories
  async findBySlugActive(slug, tenantId, excludeCategoryId = null) {
    const where = { slug, tenantId, isDeleted: false };
    if (excludeCategoryId) {
      where.id = { not: excludeCategoryId };
    }
    return await this.findFirst(where);
  }

  // Check if name matches a deleted category (for warning)
  async findDeletedByName(name, tenantId) {
    return await this.findFirst({
      name: { equals: name, mode: 'insensitive' },
      tenantId,
      isDeleted: true,
    });
  }

  async findWithChildren(categoryId, tenantId) {
    return await this.findFirst(
      { id: categoryId, tenantId },
      categoryIncludes.withChildren
    );
  }

  // Find with active children only
  async findWithActiveChildren(categoryId, tenantId) {
    return await this.findFirst(
      { id: categoryId, tenantId, isDeleted: false },
      {
        include: {
          children: {
            where: { isDeleted: false },
          },
        },
      }
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
                  isActive: true,
                  isDeleted: false,
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

  // Soft delete a category
  async softDelete(id) {
    return await this.update(id, {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  // Restore a soft-deleted category
  async restore(id) {
    return await this.update(id, {
      isActive: true,
      isDeleted: false,
      deletedAt: null,
    });
  }

  // Hard delete - only for exceptional cases
  async deleteCategory(id) {
    return await this.delete(id);
  }

  async countByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, ...where });
  }

  // Count only active (non-deleted) categories
  async countActiveByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, isDeleted: false, ...where });
  }

  async paginateByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, ...where }, page, limit, options);
  }

  // Paginate only active (non-deleted) categories
  async paginateActiveByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, isDeleted: false, ...where }, page, limit, options);
  }

  // Get all child category IDs for cascading operations
  async getAllChildIds(categoryId, tenantId) {
    const category = await this.findFirst(
      { id: categoryId, tenantId },
      { include: { children: true } }
    );
    
    if (!category) return [];
    
    let allIds = [];
    for (const child of category.children) {
      allIds.push(child.id);
      const childIds = await this.getAllChildIds(child.id, tenantId);
      allIds = [...allIds, ...childIds];
    }
    
    return allIds;
  }
}
