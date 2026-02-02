import { CategoryService } from './CategoryService.js';
import { ProductRepository } from '../repositories/ProductRepository.js';

export class StorefrontService {
  constructor() {
    this.categoryService = new CategoryService();
    this.productRepository = new ProductRepository();
  }

  /**
   * Gets store information
   */
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

  /**
   * Gets public categories (active and non-deleted only)
   */
  async getPublicCategories(tenantId) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

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

    const categoriesWithRecursiveCounts = await this.categoryService.addRecursiveCounts(
      categories,
      tenantId,
      false
    );

    return categoriesWithRecursiveCounts;
  }

  /**
   * Gets public products (active and non-deleted only)
   */
  async getPublicProducts(tenantId, filters = {}, page = 1, limit = 20) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

    const { categoryId, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    let categoryIds = null;
    if (categoryId) {
      categoryIds = await this.categoryService.getAllChildCategoryIds(categoryId, tenantId, false);
    }

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

  /**
   * Gets products by category slug (active and non-deleted only)
   */
  async getProductsByCategory(categorySlug, tenantId, filters = {}, page = 1, limit = 20) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

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
