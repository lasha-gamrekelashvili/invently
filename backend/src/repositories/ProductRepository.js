import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';
import { productIncludes } from '../utils/queryBuilders.js';

export class ProductRepository extends BaseRepository {
  constructor() {
    super(prisma.product);
  }

  async findByTenant(tenantId, options = {}) {
    return await this.findMany({ tenantId }, options);
  }

  async findByIdAndTenant(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId }, options);
  }

  // Find by ID including deleted products (for cart/order access)
  async findByIdIncludingDeleted(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId }, options);
  }

  async findBySlugAndTenant(slug, tenantId, activeOnly = false) {
    const where = { slug, tenantId, isDeleted: false };
    if (activeOnly) {
      where.isActive = true;
    }

    return await this.findFirst(where, productIncludes.fullWithFirstImage);
  }

  // Find active (non-deleted) products only
  async findActiveByTenant(tenantId, options = {}) {
    return await this.findMany({ tenantId, isDeleted: false }, options);
  }

  async findWithDetails(id, tenantId) {
    return await this.findFirst(
      { id, tenantId },
      productIncludes.full
    );
  }

  // Check if SKU already exists among ALL products (including deleted)
  // SKU must be globally unique across all products
  async findBySku(sku, tenantId, excludeProductId = null) {
    if (!sku) return null;
    const where = { sku, tenantId };
    if (excludeProductId) {
      where.id = { not: excludeProductId };
    }
    return await this.findFirst(where);
  }

  // Check if slug already exists among active (non-deleted) products
  async findBySlugActive(slug, tenantId, excludeProductId = null) {
    const where = { slug, tenantId, isDeleted: false };
    if (excludeProductId) {
      where.id = { not: excludeProductId };
    }
    return await this.findFirst(where);
  }

  // Check if name matches a deleted product (for warning)
  async findDeletedByTitle(title, tenantId) {
    return await this.findFirst({
      title: { equals: title, mode: 'insensitive' },
      tenantId,
      isDeleted: true,
    });
  }

  async createProduct(data, tenantId) {
    return await this.create({
      ...data,
      tenantId,
    });
  }

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

  async updateProduct(id, data) {
    return await this.update(id, data);
  }

  // Soft delete a product
  async softDelete(id) {
    return await this.update(id, {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  // Restore a soft-deleted product
  async restore(id) {
    return await this.update(id, {
      isActive: true,
      isDeleted: false,
      deletedAt: null,
    });
  }

  // Hard delete - only for exceptional cases
  async deleteProduct(id) {
    return await this.delete(id);
  }

  async paginateByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, ...where }, page, limit, options);
  }

  // Paginate only active (non-deleted) products
  async paginateActiveByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, isDeleted: false, ...where }, page, limit, options);
  }

  async countByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, ...where });
  }

  // Count only active (non-deleted) products
  async countActiveByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, isDeleted: false, ...where });
  }
}

export class ProductVariantRepository extends BaseRepository {
  constructor() {
    super(prisma.productVariant);
  }

  async findByProduct(productId, options = {}) {
    return await this.findMany({ productId }, options);
  }

  async findByIdAndProduct(id, productId) {
    return await this.findFirst({ id, productId });
  }

  async createVariant(productId, data) {
    return await this.create({
      ...data,
      productId,
    });
  }

  async updateVariant(id, data) {
    return await this.update(id, data);
  }

  async deleteVariant(id) {
    return await this.delete(id);
  }

  async checkStockAvailable(variantId, quantity) {
    const variant = await this.findById(variantId);
    return variant && variant.stockQuantity >= quantity;
  }

  async updateStock(variantId, quantity) {
    const variant = await this.findById(variantId);
    if (!variant) throw new Error('Variant not found');

    return await this.update(variantId, {
      stockQuantity: variant.stockQuantity + quantity,
    });
  }
}
