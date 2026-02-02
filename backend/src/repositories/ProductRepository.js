import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';
import { productIncludes } from '../utils/queryBuilders.js';

export class ProductRepository extends BaseRepository {
  constructor() {
    super(prisma.product);
  }

  /**
   * Finds products by tenant ID
   */
  async findByTenant(tenantId, options = {}) {
    return await this.findMany({ tenantId }, options);
  }

  /**
   * Finds a product by ID and tenant ID
   */
  async findByIdAndTenant(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId }, options);
  }

  /**
   * Finds a product by ID including deleted products
   */
  async findByIdIncludingDeleted(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId }, options);
  }

  /**
   * Finds a product by slug and tenant ID
   */
  async findBySlugAndTenant(slug, tenantId, activeOnly = false) {
    const where = { slug, tenantId, isDeleted: false };
    if (activeOnly) {
      where.isActive = true;
    }

    return await this.findFirst(where, productIncludes.fullWithFirstImage);
  }

  /**
   * Finds active (non-deleted) products by tenant ID
   */
  async findActiveByTenant(tenantId, options = {}) {
    return await this.findMany({ tenantId, isDeleted: false }, options);
  }

  /**
   * Finds a product with full details
   */
  async findWithDetails(id, tenantId) {
    return await this.findFirst(
      { id, tenantId },
      productIncludes.full
    );
  }

  /**
   * Finds a product by SKU (checks all products including deleted)
   */
  async findBySku(sku, tenantId, excludeProductId = null) {
    if (!sku) return null;
    const where = { sku, tenantId };
    if (excludeProductId) {
      where.id = { not: excludeProductId };
    }
    return await this.findFirst(where);
  }

  /**
   * Finds an active product by slug
   */
  async findBySlugActive(slug, tenantId, excludeProductId = null) {
    const where = { slug, tenantId, isDeleted: false };
    if (excludeProductId) {
      where.id = { not: excludeProductId };
    }
    return await this.findFirst(where);
  }

  /**
   * Finds a deleted product by title
   */
  async findDeletedByTitle(title, tenantId) {
    return await this.findFirst({
      title: { equals: title, mode: 'insensitive' },
      tenantId,
      isDeleted: true,
    });
  }

  /**
   * Creates a new product
   */
  async createProduct(data, tenantId) {
    return await this.create({
      ...data,
      tenantId,
    });
  }

  /**
   * Creates a product with variants
   */
  async createProductWithVariants(data, tenantId, variants = []) {
    return await prisma.product.create({
      data: {
        ...data,
        tenantId,
        ...(variants && variants.length > 0 && {
          variants: {
            create: variants.map(v => {
              const variantData = {
                options: v.options,
                stockQuantity: v.stockQuantity || 0,
                isActive: v.isActive !== undefined ? v.isActive : true,
              };

              if (v.sku) variantData.sku = v.sku;
              if (v.price !== undefined && v.price !== null) variantData.price = v.price;

              return variantData;
            }),
          },
        }),
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Updates a product
   */
  async updateProduct(id, data) {
    return await this.update(id, data);
  }

  /**
   * Soft deletes a product
   */
  async softDelete(id) {
    return await this.update(id, {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  /**
   * Restores a soft-deleted product
   */
  async restore(id) {
    return await this.update(id, {
      isActive: true,
      isDeleted: false,
      deletedAt: null,
    });
  }

  /**
   * Hard deletes a product
   */
  async deleteProduct(id) {
    return await this.delete(id);
  }

  /**
   * Paginates products by tenant ID
   */
  async paginateByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, ...where }, page, limit, options);
  }

  /**
   * Paginates active (non-deleted) products by tenant ID
   */
  async paginateActiveByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, isDeleted: false, ...where }, page, limit, options);
  }

  /**
   * Counts products by tenant ID
   */
  async countByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, ...where });
  }

  /**
   * Counts active (non-deleted) products by tenant ID
   */
  async countActiveByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, isDeleted: false, ...where });
  }
}

export class ProductVariantRepository extends BaseRepository {
  constructor() {
    super(prisma.productVariant);
  }

  /**
   * Finds variants by product ID
   */
  async findByProduct(productId, options = {}) {
    return await this.findMany({ productId }, options);
  }

  /**
   * Finds a variant by ID and product ID
   */
  async findByIdAndProduct(id, productId) {
    return await this.findFirst({ id, productId });
  }

  /**
   * Creates a variant for a product
   */
  async createVariant(productId, data) {
    return await this.create({
      ...data,
      productId,
    });
  }

  /**
   * Updates a variant
   */
  async updateVariant(id, data) {
    return await this.update(id, data);
  }

  /**
   * Deletes a variant
   */
  async deleteVariant(id) {
    return await this.delete(id);
  }

  /**
   * Checks if variant has sufficient stock
   */
  async checkStockAvailable(variantId, quantity) {
    const variant = await this.findById(variantId);
    return variant && variant.stockQuantity >= quantity;
  }

  /**
   * Updates variant stock quantity
   */
  async updateStock(variantId, quantity) {
    const variant = await this.findById(variantId);
    if (!variant) throw new Error('Variant not found');

    return await this.update(variantId, {
      stockQuantity: variant.stockQuantity + quantity,
    });
  }
}
