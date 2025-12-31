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

    const categories = await this.categoryService.categoryRepository.findMany(
      {
        tenantId,
        isActive: true,
      },
      {
        include: {
          children: {
            where: {
              isActive: true,
            },
          },
          _count: {
            select: {
              products: {
                where: {
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }
    );

    // Add recursive counts to all categories using CategoryService helper
    const categoriesWithRecursiveCounts = await this.categoryService.addRecursiveCounts(
      categories,
      tenantId
    );

    return categoriesWithRecursiveCounts;
  }

  async getPublicProducts(tenantId, filters = {}, page = 1, limit = 20) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

    const { categoryId, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    // Get all category IDs including children recursively
    let categoryIds = null;
    if (categoryId) {
      categoryIds = await this.categoryService.getAllChildCategoryIds(categoryId, tenantId);
    }

    const where = {
      tenantId,
      status: 'ACTIVE',
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

    const product = await this.productRepository.findFirst(
      {
        slug,
        tenantId,
        status: 'ACTIVE',
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

    // Find the category
    const category = await this.categoryService.categoryRepository.findFirst(
      {
        slug: categorySlug,
        tenantId,
        isActive: true,
      }
    );

    if (!category) {
      throw new Error('Category not found');
    }

    const where = {
      categoryId: category.id,
      tenantId,
      status: 'ACTIVE',
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
