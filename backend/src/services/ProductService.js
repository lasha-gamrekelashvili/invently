import { ProductRepository, ProductVariantRepository } from '../repositories/ProductRepository.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { CategoryService } from './CategoryService.js';
import { buildProductFilters, buildPagination } from '../utils/queryBuilders.js';

export class ProductService {
  constructor() {
    this.productRepository = new ProductRepository();
    this.variantRepository = new ProductVariantRepository();
    this.categoryRepository = new CategoryRepository();
    this.categoryService = new CategoryService();
  }

  // Validate category exists, belongs to tenant, and is not deleted
  async validateCategory(categoryId, tenantId) {
    if (!categoryId) return true;

    const category = await this.categoryRepository.findActiveByIdAndTenant(categoryId, tenantId);
    if (!category) {
      throw new Error('Category not found');
    }
    return true;
  }

  // Validate SKU uniqueness among ALL products (including deleted)
  // SKU must be globally unique and cannot be reused
  async validateSku(sku, tenantId, excludeProductId = null) {
    if (!sku) return { valid: true };

    const existingProduct = await this.productRepository.findBySku(sku, tenantId, excludeProductId);
    if (existingProduct) {
      const status = existingProduct.isDeleted ? ' (deleted product)' : '';
      throw new Error(`SKU already exists for another product${status}`);
    }
    return { valid: true };
  }

  // Validate slug uniqueness among active products
  async validateSlug(slug, tenantId, excludeProductId = null) {
    const existingProduct = await this.productRepository.findBySlugActive(slug, tenantId, excludeProductId);
    if (existingProduct) {
      throw new Error('Slug already exists for another active product');
    }
    return { valid: true };
  }

  // Check if product name matches a deleted product (for warning)
  async checkDeletedProductWarning(title, tenantId) {
    const deletedProduct = await this.productRepository.findDeletedByTitle(title, tenantId);
    return deletedProduct ? {
      warning: true,
      message: `A deleted product with the name "${title}" exists. You can restore it instead of creating a new one.`,
      deletedProductId: deletedProduct.id,
    } : { warning: false };
  }

  // Create a new product
  async createProduct(data, tenantId) {
    const { title, description, slug, sku, price, stockQuantity, isActive = true, categoryId, attributes, variants } = data;

    // Validate category if provided
    await this.validateCategory(categoryId, tenantId);

    // Validate SKU uniqueness
    await this.validateSku(sku, tenantId);

    // Validate slug uniqueness
    await this.validateSlug(slug, tenantId);

    // Check for deleted product warning (optional - don't block creation)
    const deletedWarning = await this.checkDeletedProductWarning(title, tenantId);

    // Create product with variants if provided
    let product;
    if (variants && variants.length > 0) {
      product = await this.productRepository.createProductWithVariants(
        { title, description, slug, sku, price, stockQuantity, categoryId, attributes, isActive, isDeleted: false },
        tenantId,
        variants
      );
    } else {
      // Create product without variants
      product = await this.productRepository.createProduct(
        { title, description, slug, sku, price, stockQuantity, categoryId, attributes, isActive, isDeleted: false },
        tenantId
      );
    }

    // Attach warning if name matches deleted product
    if (deletedWarning.warning) {
      product._warning = deletedWarning;
    }

    return product;
  }

  // Get products with filtering and pagination (admin view - includes deleted with indicators)
  async getProducts(tenantId, filters = {}, page = 1, limit = 10, includeDeleted = true) {
    const { sortBy = 'createdAt', sortOrder = 'desc', search, categoryId, isActive, isDeleted, minPrice, maxPrice } = filters;

    // Build where clause
    const where = {};

    // Handle isDeleted filter - explicit filter value takes precedence
    if (isDeleted !== undefined) {
      // Explicit isDeleted filter from query params
      where.isDeleted = isDeleted === true || isDeleted === 'true';
    } else if (!includeDeleted) {
      // For public queries, exclude deleted products
      where.isDeleted = false;
    }
    // If includeDeleted=true and no explicit isDeleted filter, show all (admin panel)

    // Handle hierarchical category filtering
    if (categoryId) {
      const allCategoryIds = await this.categoryService.getAllChildCategoryIds(categoryId, tenantId);
      where.categoryId = {
        in: allCategoryIds,
      };
    }

    // Filter by isActive (true = active, false = inactive/draft)
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

    // Handle price range filter
    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = {
        gte: parseFloat(minPrice),
        lte: parseFloat(maxPrice),
      };
    } else if (minPrice !== undefined) {
      where.price = { gte: parseFloat(minPrice) };
    } else if (maxPrice !== undefined) {
      where.price = { lte: parseFloat(maxPrice) };
    }

    const options = {
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
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

  // Get product by ID
  async getProductById(id, tenantId) {
    const product = await this.productRepository.findFirst(
      { id, tenantId },
      {
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          variants: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }
    );

    return product;
  }

  // Get product by slug
  async getProductBySlug(slug, tenantId, activeOnly = false) {
    const product = await this.productRepository.findBySlugAndTenant(
      slug,
      tenantId,
      activeOnly
    );

    return product;
  }

  // Update a product
  async updateProduct(id, data, tenantId) {
    const { title, description, slug, sku, price, stockQuantity, categoryId, attributes, isActive } = data;

    // Check if product exists and belongs to tenant (including deleted for admin access)
    const existingProduct = await this.productRepository.findByIdAndTenant(id, tenantId);

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Don't allow updates on deleted products (use restore first)
    if (existingProduct.isDeleted) {
      throw new Error('Cannot update a deleted product. Restore it first.');
    }

    // Validate category if provided
    await this.validateCategory(categoryId, tenantId);

    // Validate SKU uniqueness if changed
    if (sku !== undefined && sku !== existingProduct.sku) {
      await this.validateSku(sku, tenantId, id);
    }

    // Validate slug uniqueness if changed
    if (slug !== undefined && slug !== existingProduct.slug) {
      await this.validateSlug(slug, tenantId, id);
    }

    // Build update data (only include defined fields)
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

  // Soft delete a product
  async deleteProduct(id, tenantId) {
    // Check if product exists and belongs to tenant
    const product = await this.productRepository.findByIdAndTenant(id, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.isDeleted) {
      throw new Error('Product is already deleted');
    }

    // Soft delete - products in cart/orders remain accessible
    return await this.productRepository.softDelete(id);
  }

  // Restore a soft-deleted product
  async restoreProduct(id, tenantId) {
    const product = await this.productRepository.findByIdAndTenant(id, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isDeleted) {
      throw new Error('Product is not deleted');
    }

    // Check if slug is still available for active products
    const slugConflict = await this.productRepository.findBySlugActive(product.slug, tenantId, id);
    if (slugConflict) {
      throw new Error(`Cannot restore: slug "${product.slug}" is now used by another active product`);
    }

    // Note: SKU is globally unique (including deleted products), so no need to check SKU conflicts
    // The deleted product already owns its SKU

    return await this.productRepository.restore(id);
  }

  // Get product by ID (for admin - includes deleted products with indicator)
  async getProductByIdAdmin(id, tenantId) {
    const product = await this.productRepository.findFirst(
      { id, tenantId },
      {
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          variants: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }
    );

    return product;
  }

  // Variant management methods

  // Create a variant for a product
  async createVariant(productId, data, tenantId) {
    const { sku, options, price, stockQuantity, isActive } = data;

    // Verify product exists and belongs to tenant
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

  // Update a variant
  async updateVariant(productId, variantId, data, tenantId) {
    const { sku, options, price, stockQuantity, isActive } = data;

    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findByIdAndTenant(productId, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    // Verify variant exists and belongs to product
    const existingVariant = await this.variantRepository.findByIdAndProduct(variantId, productId);

    if (!existingVariant) {
      throw new Error('Variant not found');
    }

    // Build update data
    const updateData = {};
    if (sku !== undefined) updateData.sku = sku;
    if (options !== undefined) updateData.options = options;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (isActive !== undefined) updateData.isActive = isActive;

    return await this.variantRepository.update(variantId, updateData);
  }

  // Delete a variant
  async deleteVariant(productId, variantId, tenantId) {
    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findByIdAndTenant(productId, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    // Verify variant exists and belongs to product
    const variant = await this.variantRepository.findByIdAndProduct(variantId, productId);

    if (!variant) {
      throw new Error('Variant not found');
    }

    return await this.variantRepository.delete(variantId);
  }

  // Check if product/variant has sufficient stock
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
