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

  async findBySlugAndTenant(slug, tenantId, status = null) {
    const where = { slug, tenantId };
    if (status) where.status = status;

    return await this.findFirst(where, productIncludes.fullWithFirstImage);
  }

  async findWithDetails(id, tenantId) {
    return await this.findFirst(
      { id, tenantId },
      productIncludes.full
    );
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

  async deleteProduct(id) {
    return await this.delete(id);
  }

  async paginateByTenant(tenantId, where = {}, page = 1, limit = 10, options = {}) {
    return await this.paginate({ tenantId, ...where }, page, limit, options);
  }

  async countByTenant(tenantId, where = {}) {
    return await this.count({ tenantId, ...where });
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
