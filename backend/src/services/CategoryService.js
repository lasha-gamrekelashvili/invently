import { CategoryRepository } from '../repositories/CategoryRepository.js';

export class CategoryService {
  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  // Recursive helper to calculate total product count including children
  async calculateRecursiveProductCount(categoryId, tenantId) {
    const category = await this.categoryRepository.findFirst(
      { id: categoryId, tenantId },
      {
        include: {
          children: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      }
    );

    if (!category) return 0;

    let totalCount = category._count.products;

    // Recursively add counts from all children
    for (const child of category.children) {
      totalCount += await this.calculateRecursiveProductCount(child.id, tenantId);
    }

    return totalCount;
  }

  // Get all child category IDs recursively
  async getAllChildCategoryIds(categoryId, tenantId) {
    const category = await this.categoryRepository.findWithChildren(categoryId, tenantId);

    if (!category) return [];

    let allIds = [categoryId];

    // Recursively get IDs from all children
    for (const child of category.children) {
      const childIds = await this.getAllChildCategoryIds(child.id, tenantId);
      allIds = [...allIds, ...childIds];
    }

    return allIds;
  }

  // Add recursive product counts to a list of categories
  async addRecursiveCounts(categories, tenantId) {
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        _recursiveCount: await this.calculateRecursiveProductCount(category.id, tenantId),
      }))
    );
    return categoriesWithCounts;
  }

  // Get all products in a category and its children recursively
  async getRecursiveProducts(categoryId, tenantId) {
    const ProductRepository = (await import('../repositories/ProductRepository.js')).ProductRepository;
    const productRepository = new ProductRepository();

    const category = await this.categoryRepository.findWithChildren(categoryId, tenantId);

    if (!category) return [];

    // Get products directly in this category
    const directProducts = await productRepository.findMany(
      { categoryId, tenantId },
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
            take: 1,
          },
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }
    );

    // Get products from all child categories recursively
    const childProducts = await Promise.all(
      category.children.map((child) => this.getRecursiveProducts(child.id, tenantId))
    );

    // Flatten the array of arrays
    const allChildProducts = childProducts.flat();

    // Combine direct products with child products
    return [...directProducts, ...allChildProducts];
  }

  // Create a new category
  async createCategory(data, tenantId) {
    // Validate parent category if provided
    if (data.parentId) {
      const parentCategory = await this.categoryRepository.findByIdAndTenant(data.parentId, tenantId);

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    return await this.categoryRepository.create({
      ...data,
      tenantId,
    });
  }

  // Get categories with pagination and recursive counts
  async getCategories(tenantId, filters = {}, page = 1, limit = 10) {
    const { sortBy = 'createdAt', sortOrder = 'desc', search } = filters;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const options = {
      include: {
        parent: true,
        children: true,
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
      orderBy: { [sortBy]: sortOrder },
    };

    const result = await this.categoryRepository.paginateByTenant(tenantId, where, page, limit, options);

    // Add recursive counts to categories
    const categoriesWithRecursiveCounts = await this.addRecursiveCounts(result.items, tenantId);

    return {
      categories: categoriesWithRecursiveCounts,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }

  // Get category by ID with full details
  async getCategoryById(id, tenantId) {
    const category = await this.categoryRepository.findFirst(
      { id, tenantId },
      {
        include: {
          parent: true,
          children: true,
          products: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      }
    );

    if (!category) {
      return null;
    }

    // Add recursive product count and all products
    const recursiveCount = await this.calculateRecursiveProductCount(category.id, tenantId);
    const allProducts = await this.getRecursiveProducts(category.id, tenantId);

    return {
      ...category,
      _recursiveCount: recursiveCount,
      allProducts: allProducts,
    };
  }

  // Update a category
  async updateCategory(id, data, tenantId) {
    // Check if category exists and belongs to tenant
    const existingCategory = await this.categoryRepository.findByIdAndTenant(id, tenantId);

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Validate parent category if provided
    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parentCategory = await this.categoryRepository.findByIdAndTenant(data.parentId, tenantId);

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    return await this.categoryRepository.update(id, data);
  }

  // Delete a category
  async deleteCategory(id, tenantId) {
    // Check if category exists and belongs to tenant
    const category = await this.categoryRepository.findFirst(
      { id, tenantId },
      {
        include: {
          children: true,
          products: true,
        },
      }
    );

    if (!category) {
      throw new Error('Category not found');
    }

    if (category.children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    if (category.products.length > 0) {
      throw new Error('Cannot delete category with products');
    }

    return await this.categoryRepository.delete(id);
  }
}
