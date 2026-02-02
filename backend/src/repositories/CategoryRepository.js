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

  /**
   * Finds an active (non-deleted) category by ID and tenant ID
   */
  async findActiveByIdAndTenant(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId, isDeleted: false }, options);
  }

  /**
   * Finds a category by slug and tenant ID
   */
  async findBySlugAndTenant(slug, tenantId, options = {}) {
    return await this.findFirst({ slug, tenantId, isDeleted: false }, options);
  }

  /**
   * Finds an active category by slug
   */
  async findBySlugActive(slug, tenantId, excludeCategoryId = null) {
    const where = { slug, tenantId, isDeleted: false };
    if (excludeCategoryId) {
      where.id = { not: excludeCategoryId };
    }
    return await this.findFirst(where);
  }

  /**
   * Finds a deleted category by name
   */
  async findDeletedByName(name, tenantId) {
    return await this.findFirst({
      name: { equals: name, mode: 'insensitive' },
      tenantId,
      isDeleted: true,
    });
  }

  /**
   * Finds a category with its children
   */
  async findWithChildren(categoryId, tenantId) {
    return await this.findFirst(
      { id: categoryId, tenantId },
      categoryIncludes.withChildren
    );
  }

  /**
   * Finds a category with active children only
   */
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

  /**
   * Finds a category with its products
   */
  async findWithProducts(categoryId, tenantId) {
    return await this.findFirst(
      { id: categoryId, tenantId },
      categoryIncludes.withProducts
    );
  }

  /**
   * Finds categories with product counts
   */
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

  /**
   * Creates a new category
   */
  async createCategory(data, tenantId) {
    return await this.create({
      ...data,
      tenantId,
    });
  }

  /**
   * Updates a category
   */
  async updateCategory(id, data) {
    return await this.update(id, data);
  }

  /**
   * Soft deletes a category
   */
  async softDelete(id) {
    return await this.update(id, {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  /**
   * Restores a soft-deleted category
   */
  async restore(id) {
    return await this.update(id, {
      isActive: true,
      isDeleted: false,
      deletedAt: null,
    });
  }

  /**
   * Hard deletes a category
   */
  async deleteCategory(id) {
    return await this.delete(id);
  }

  /**
   * Counts categories by tenant ID
   */
  async countByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, ...where });
  }

  /**
   * Counts active (non-deleted) categories by tenant ID
   */
  async countActiveByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, isDeleted: false, ...where });
  }

  /**
   * Paginates categories by tenant ID
   */
  async paginateByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, ...where }, page, limit, options);
  }

  /**
   * Paginates active (non-deleted) categories by tenant ID
   */
  async paginateActiveByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, isDeleted: false, ...where }, page, limit, options);
  }

  /**
   * Gets all child category IDs recursively for cascading operations
   */
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
