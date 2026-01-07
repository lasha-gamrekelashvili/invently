import { CategoryService } from './CategoryService.js';
import { ProductRepository } from '../repositories/ProductRepository.js';

export class StorefrontService {
  constructor() {
    this.categoryService = new CategoryService();
    this.productRepository = new ProductRepository();
  }

  async getStoreInfo(tenant) {
    if (!tenant) {
      throw new Error('Store not found');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      description: tenant.description,
    };
  }

  async getPublicCategories(tenantId) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

    // Only show active and non-deleted categories for public storefront
    const categories = await this.categoryService.categoryRepository.findMany(
      {
        tenantId,
        isActive: true,
        isDeleted: false,
      },
      {
        include: {
          children: {
            where: {
              isActive: true,
              isDeleted: false,
            },
          },
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
        orderBy: { name: 'asc' },
      }
    );

    // Add recursive counts to all categories using CategoryService helper (only count active products)
    const categoriesWithRecursiveCounts = await this.categoryService.addRecursiveCounts(
      categories,
      tenantId,
      false // Don't include deleted
    );

    return categoriesWithRecursiveCounts;
  }

  async getPublicProducts(tenantId, filters = {}, page = 1, limit = 20) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

    const { categoryId, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    // Get all category IDs including children recursively (only active categories)
    let categoryIds = null;
    if (categoryId) {
      categoryIds = await this.categoryService.getAllChildCategoryIds(categoryId, tenantId, false);
    }

    // Only show active and non-deleted products for public storefront
    const where = {
      tenantId,
      isActive: true,
      isDeleted: false,
    };

    if (categoryIds) {
      where.categoryId = { in: categoryIds };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice && maxPrice) {
      where.price = { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) };
    } else if (minPrice) {
      where.price = { gte: parseFloat(minPrice) };
    } else if (maxPrice) {
      where.price = { lte: parseFloat(maxPrice) };
    }

    const options = {
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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

    const result = await this.productRepository.paginate(where, page, limit, options);

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

  async getPublicProductBySlug(slug, tenantId) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

    // Only show active and non-deleted products
    const product = await this.productRepository.findFirst(
      {
        slug,
        tenantId,
        isActive: true,
        isDeleted: false,
      },
      {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async getProductsByCategory(categorySlug, tenantId, filters = {}, page = 1, limit = 20) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    // Find the category (only active and non-deleted)
    const category = await this.categoryService.categoryRepository.findFirst(
      {
        slug: categorySlug,
        tenantId,
        isActive: true,
        isDeleted: false,
      }
    );

    if (!category) {
      throw new Error('Category not found');
    }

    // Only show active and non-deleted products
    const where = {
      categoryId: category.id,
      tenantId,
      isActive: true,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const options = {
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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

    const result = await this.productRepository.paginate(where, page, limit, options);

    return {
      category,
      products: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }
}
