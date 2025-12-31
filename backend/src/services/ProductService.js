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

  // Validate category exists and belongs to tenant
  async validateCategory(categoryId, tenantId) {
    if (!categoryId) return true;

    const category = await this.categoryRepository.findByIdAndTenant(categoryId, tenantId);
    if (!category) {
      throw new Error('Category not found');
    }
    return true;
  }

  // Create a new product
  async createProduct(data, tenantId) {
    const { title, description, slug, price, stockQuantity, status, categoryId, attributes, variants } = data;

    // Validate category if provided
    await this.validateCategory(categoryId, tenantId);

    // Create product with variants if provided
    if (variants && variants.length > 0) {
      return await this.productRepository.createProductWithVariants(
        { title, description, slug, price, stockQuantity, status, categoryId, attributes },
        tenantId,
        variants
      );
    }

    // Create product without variants
    return await this.productRepository.createProduct(
      { title, description, slug, price, stockQuantity, status, categoryId, attributes },
      tenantId
    );
  }

  // Get products with filtering and pagination
  async getProducts(tenantId, filters = {}, page = 1, limit = 10) {
    const { sortBy = 'createdAt', sortOrder = 'desc', search, categoryId, status, minPrice, maxPrice } = filters;

    // Build where clause
    const where = {};

    // Handle hierarchical category filtering
    if (categoryId) {
      const allCategoryIds = await this.categoryService.getAllChildCategoryIds(categoryId, tenantId);
      where.categoryId = {
        in: allCategoryIds,
      };
    }

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
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
      activeOnly ? 'ACTIVE' : null
    );

    return product;
  }

  // Update a product
  async updateProduct(id, data, tenantId) {
    const { title, description, slug, price, stockQuantity, status, categoryId, attributes } = data;

    // Check if product exists and belongs to tenant
    const existingProduct = await this.productRepository.findByIdAndTenant(id, tenantId);

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Validate category if provided
    await this.validateCategory(categoryId, tenantId);

    // Build update data (only include defined fields)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (slug !== undefined) updateData.slug = slug;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (status !== undefined) updateData.status = status;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (attributes !== undefined) updateData.attributes = attributes;

    return await this.productRepository.update(id, updateData);
  }

  // Delete a product
  async deleteProduct(id, tenantId) {
    // Check if product exists and belongs to tenant
    const product = await this.productRepository.findByIdAndTenant(id, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    return await this.productRepository.delete(id);
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
