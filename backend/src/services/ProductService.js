import { ProductRepository, ProductVariantRepository } from '../repositories/ProductRepository.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { CategoryService } from './CategoryService.js';

export class ProductService {
  constructor() {
    this.productRepository = new ProductRepository();
    this.variantRepository = new ProductVariantRepository();
    this.categoryRepository = new CategoryRepository();
    this.categoryService = new CategoryService();
  }

  /**
   * Validates that a category exists and belongs to tenant
   */
  async validateCategory(categoryId, tenantId) {
    if (!categoryId) return true;

    const category = await this.categoryRepository.findActiveByIdAndTenant(categoryId, tenantId);
    if (!category) {
      throw new Error('Category not found');
    }
    return true;
  }

  /**
   * Validates SKU uniqueness among all products (including deleted)
   */
  async validateSku(sku, tenantId, excludeProductId = null) {
    if (!sku) return { valid: true };

    const existingProduct = await this.productRepository.findBySku(sku, tenantId, excludeProductId);
    if (existingProduct) {
      const status = existingProduct.isDeleted ? ' (deleted product)' : '';
      throw new Error(`SKU already exists for another product${status}`);
    }
    return { valid: true };
  }

  /**
   * Validates slug uniqueness among active products
   */
  async validateSlug(slug, tenantId, excludeProductId = null) {
    const existingProduct = await this.productRepository.findBySlugActive(slug, tenantId, excludeProductId);
    if (existingProduct) {
      throw new Error('Slug already exists for another active product');
    }
    return { valid: true };
  }

  /**
   * Checks if product name matches a deleted product for warning
   */
  async checkDeletedProductWarning(title, tenantId) {
    const deletedProduct = await this.productRepository.findDeletedByTitle(title, tenantId);
    return deletedProduct ? {
      warning: true,
      message: `A deleted product with the name "${title}" exists. You can restore it instead of creating a new one.`,
      deletedProductId: deletedProduct.id,
    } : { warning: false };
  }

  /**
   * Creates a new product with optional variants
   */
  async createProduct(data, tenantId) {
    const { title, description, slug, sku, price, stockQuantity, isActive = true, categoryId, attributes, variants } = data;

    await this.validateCategory(categoryId, tenantId);
    await this.validateSku(sku, tenantId);
    await this.validateSlug(slug, tenantId);

    const deletedWarning = await this.checkDeletedProductWarning(title, tenantId);

    let product;
    if (variants && variants.length > 0) {
      product = await this.productRepository.createProductWithVariants(
        { title, description, slug, sku, price, stockQuantity, categoryId, attributes, isActive, isDeleted: false },
        tenantId,
        variants
      );
    } else {
      product = await this.productRepository.createProduct(
        { title, description, slug, sku, price, stockQuantity, categoryId, attributes, isActive, isDeleted: false },
        tenantId
      );
    }

    if (deletedWarning.warning) {
      product._warning = deletedWarning;
    }

    return product;
  }

  /**
   * Gets products with filtering and pagination
   */
  async getProducts(tenantId, filters = {}, page = 1, limit = 10, includeDeleted = true) {
    const { sortBy = 'createdAt', sortOrder = 'desc', search, categoryId, isActive, isDeleted, minPrice, maxPrice } = filters;

    const where = {};

    if (isDeleted !== undefined) {
      where.isDeleted = isDeleted === true || isDeleted === 'true';
    } else if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (categoryId) {
      const allCategoryIds = await this.categoryService.getAllChildCategoryIds(categoryId, tenantId);
      where.categoryId = { in: allCategoryIds };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === true || isActive === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) };
    } else if (minPrice !== undefined) {
      where.price = { gte: parseFloat(minPrice) };
    } else if (maxPrice !== undefined) {
      where.price = { lte: parseFloat(maxPrice) };
    }

    const options = {
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { [sortBy]: sortOrder },
    };

    const result = await this.productRepository.paginateByTenant(tenantId, where, page, limit, options);

    return {
      products: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }

  /**
   * Gets a product by ID
   */
  async getProductById(id, tenantId) {
    return await this.productRepository.findFirst(
      { id, tenantId },
      {
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { orderBy: { createdAt: 'asc' } },
        },
      }
    );
  }

  /**
   * Gets a product by slug
   */
  async getProductBySlug(slug, tenantId, activeOnly = false) {
    return await this.productRepository.findBySlugAndTenant(slug, tenantId, activeOnly);
  }

  /**
   * Updates a product
   */
  async updateProduct(id, data, tenantId) {
    const { title, description, slug, sku, price, stockQuantity, categoryId, attributes, isActive } = data;

    const existingProduct = await this.productRepository.findByIdAndTenant(id, tenantId);

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    if (existingProduct.isDeleted) {
      throw new Error('Cannot update a deleted product. Restore it first.');
    }

    await this.validateCategory(categoryId, tenantId);

    if (sku !== undefined && sku !== existingProduct.sku) {
      await this.validateSku(sku, tenantId, id);
    }

    if (slug !== undefined && slug !== existingProduct.slug) {
      await this.validateSlug(slug, tenantId, id);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (slug !== undefined) updateData.slug = slug;
    if (sku !== undefined) updateData.sku = sku;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (attributes !== undefined) updateData.attributes = attributes;
    if (isActive !== undefined) updateData.isActive = isActive;

    return await this.productRepository.update(id, updateData);
  }

  /**
   * Soft deletes a product
   */
  async deleteProduct(id, tenantId) {
    const product = await this.productRepository.findByIdAndTenant(id, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.isDeleted) {
      throw new Error('Product is already deleted');
    }

    return await this.productRepository.softDelete(id);
  }

  /**
   * Restores a soft-deleted product
   */
  async restoreProduct(id, tenantId) {
    const product = await this.productRepository.findByIdAndTenant(id, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isDeleted) {
      throw new Error('Product is not deleted');
    }

    const slugConflict = await this.productRepository.findBySlugActive(product.slug, tenantId, id);
    if (slugConflict) {
      throw new Error(`Cannot restore: slug "${product.slug}" is now used by another active product`);
    }

    return await this.productRepository.restore(id);
  }

  /**
   * Gets a product by ID for admin (includes deleted)
   */
  async getProductByIdAdmin(id, tenantId) {
    return await this.productRepository.findFirst(
      { id, tenantId },
      {
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { orderBy: { createdAt: 'asc' } },
        },
      }
    );
  }

  /**
   * Creates a variant for a product
   */
  async createVariant(productId, data, tenantId) {
    const { sku, options, price, stockQuantity, isActive } = data;

    const product = await this.productRepository.findByIdAndTenant(productId, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    return await this.variantRepository.createVariant(productId, {
      sku,
      options,
      price,
      stockQuantity: stockQuantity || 0,
      isActive: isActive !== undefined ? isActive : true,
    });
  }

  /**
   * Updates a variant
   */
  async updateVariant(productId, variantId, data, tenantId) {
    const { sku, options, price, stockQuantity, isActive } = data;

    const product = await this.productRepository.findByIdAndTenant(productId, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    const existingVariant = await this.variantRepository.findByIdAndProduct(variantId, productId);

    if (!existingVariant) {
      throw new Error('Variant not found');
    }

    const updateData = {};
    if (sku !== undefined) updateData.sku = sku;
    if (options !== undefined) updateData.options = options;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (isActive !== undefined) updateData.isActive = isActive;

    return await this.variantRepository.update(variantId, updateData);
  }

  /**
   * Deletes a variant
   */
  async deleteVariant(productId, variantId, tenantId) {
    const product = await this.productRepository.findByIdAndTenant(productId, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    const variant = await this.variantRepository.findByIdAndProduct(variantId, productId);

    if (!variant) {
      throw new Error('Variant not found');
    }

    return await this.variantRepository.delete(variantId);
  }

  /**
   * Checks if product/variant has sufficient stock
   */
  async checkStockAvailable(productId, quantity, variantId = null) {
    if (variantId) {
      const variant = await this.variantRepository.findById(variantId);
      return variant && variant.stockQuantity >= quantity;
    } else {
      const product = await this.productRepository.findById(productId);
      return product && product.stockQuantity >= quantity;
    }
  }
}
