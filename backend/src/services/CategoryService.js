import { CategoryRepository } from '../repositories/CategoryRepository.js';
import prisma from '../repositories/BaseRepository.js';

export class CategoryService {
  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  // Recursive helper to calculate total product count including children (only active products in active categories)
  async calculateRecursiveProductCount(categoryId, tenantId, includeDeleted = false) {
    const category = await this.categoryRepository.findFirst(
      { id: categoryId, tenantId },
      {
        include: {
          children: includeDeleted ? true : { where: { isDeleted: false } },
          _count: {
            select: {
              products: {
                where: includeDeleted ? {} : { isDeleted: false, isActive: true },
              },
            },
          },
        },
      }
    );

    if (!category) return 0;

    let totalCount = category._count.products;

    // Recursively add counts from all children
    for (const child of category.children) {
      totalCount += await this.calculateRecursiveProductCount(child.id, tenantId, includeDeleted);
    }

    return totalCount;
  }

  // Check if name matches a deleted category (for warning)
  async checkDeletedCategoryWarning(name, tenantId) {
    const deletedCategory = await this.categoryRepository.findDeletedByName(name, tenantId);
    return deletedCategory ? {
      warning: true,
      message: `A deleted category with the name "${name}" exists. You can restore it instead of creating a new one.`,
      deletedCategoryId: deletedCategory.id,
    } : { warning: false };
  }

  // Validate slug uniqueness among active categories
  async validateSlug(slug, tenantId, excludeCategoryId = null) {
    const existingCategory = await this.categoryRepository.findBySlugActive(slug, tenantId, excludeCategoryId);
    if (existingCategory) {
      throw new Error('Slug already exists for another active category');
    }
    return { valid: true };
  }

  // Get all child category IDs recursively (only active categories by default)
  async getAllChildCategoryIds(categoryId, tenantId, includeDeleted = false) {
    const category = await this.categoryRepository.findFirst(
      { id: categoryId, tenantId },
      {
        include: {
          children: includeDeleted ? true : { where: { isDeleted: false } },
        },
      }
    );

    if (!category) return [];

    let allIds = [categoryId];

    // Recursively get IDs from all children
    for (const child of category.children) {
      const childIds = await this.getAllChildCategoryIds(child.id, tenantId, includeDeleted);
      allIds = [...allIds, ...childIds];
    }

    return allIds;
  }

  // Add recursive product counts to a list of categories
  async addRecursiveCounts(categories, tenantId, includeDeleted = false) {
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        _recursiveCount: await this.calculateRecursiveProductCount(category.id, tenantId, includeDeleted),
      }))
    );
    return categoriesWithCounts;
  }

  // Get all products in a category and its children recursively
  async getRecursiveProducts(categoryId, tenantId, includeDeleted = false) {
    const ProductRepository = (await import('../repositories/ProductRepository.js')).ProductRepository;
    const productRepository = new ProductRepository();

    const category = await this.categoryRepository.findFirst(
      { id: categoryId, tenantId },
      {
        include: {
          children: includeDeleted ? true : { where: { isDeleted: false } },
        },
      }
    );

    if (!category) return [];

    // Build product filter
    const productWhere = { categoryId, tenantId };
    if (!includeDeleted) {
      productWhere.isDeleted = false;
    }

    // Get products directly in this category
    const directProducts = await productRepository.findMany(
      productWhere,
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
      category.children.map((child) => this.getRecursiveProducts(child.id, tenantId, includeDeleted))
    );

    // Flatten the array of arrays
    const allChildProducts = childProducts.flat();

    // Combine direct products with child products
    return [...directProducts, ...allChildProducts];
  }

  // Create a new category
  async createCategory(data, tenantId) {
    // Validate parent category if provided (must be active)
    if (data.parentId) {
      const parentCategory = await this.categoryRepository.findActiveByIdAndTenant(data.parentId, tenantId);

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    // Validate slug uniqueness
    await this.validateSlug(data.slug, tenantId);

    // Check for deleted category warning (optional - don't block creation)
    const deletedWarning = await this.checkDeletedCategoryWarning(data.name, tenantId);

    const category = await this.categoryRepository.create({
      ...data,
      tenantId,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDeleted: false,
    });

    // Attach warning if name matches deleted category
    if (deletedWarning.warning) {
      category._warning = deletedWarning;
    }

    return category;
  }

  // Get categories with pagination and recursive counts (admin view - includes deleted with indicators)
  async getCategories(tenantId, filters = {}, page = 1, limit = 10, includeDeleted = false) {
    const { sortBy = 'createdAt', sortOrder = 'desc', search } = filters;

    const where = {};

    // Exclude deleted categories by default unless explicitly requested
    if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const options = {
      include: {
        parent: true,
        children: includeDeleted ? true : { where: { isDeleted: false } },
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
      orderBy: { [sortBy]: sortOrder },
    };

    const result = await this.categoryRepository.paginateByTenant(tenantId, where, page, limit, options);

    // Add recursive counts to categories
    const categoriesWithRecursiveCounts = await this.addRecursiveCounts(result.items, tenantId, includeDeleted);

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

  // Get category by ID with full details (admin view - includes deleted with indicators)
  async getCategoryById(id, tenantId, includeDeleted = true) {
    const category = await this.categoryRepository.findFirst(
      { id, tenantId },
      {
        include: {
          parent: true,
          children: includeDeleted ? true : { where: { isDeleted: false } },
          products: includeDeleted ? true : { where: { isDeleted: false } },
          _count: {
            select: {
              products: includeDeleted ? true : { where: { isDeleted: false } },
            },
          },
        },
      }
    );

    if (!category) {
      return null;
    }

    // Add recursive product count and all products
    const recursiveCount = await this.calculateRecursiveProductCount(category.id, tenantId, includeDeleted);
    const allProducts = await this.getRecursiveProducts(category.id, tenantId, includeDeleted);

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

    // Don't allow updates on deleted categories (use restore first)
    if (existingCategory.isDeleted) {
      throw new Error('Cannot update a deleted category. Restore it first.');
    }

    // Validate parent category if provided (must be active)
    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parentCategory = await this.categoryRepository.findActiveByIdAndTenant(data.parentId, tenantId);

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    // Validate slug uniqueness if changed
    if (data.slug !== undefined && data.slug !== existingCategory.slug) {
      await this.validateSlug(data.slug, tenantId, id);
    }

    return await this.categoryRepository.update(id, data);
  }

  // Soft delete a category with cascade to children
  async deleteCategory(id, tenantId) {
    // Check if category exists and belongs to tenant
    const category = await this.categoryRepository.findFirst(
      { id, tenantId },
      {
        include: {
          children: { where: { isDeleted: false } },
          products: { where: { isDeleted: false } },
        },
      }
    );

    if (!category) {
      throw new Error('Category not found');
    }

    if (category.isDeleted) {
      throw new Error('Category is already deleted');
    }

    // Use transaction to handle cascade operations
    await prisma.$transaction(async (tx) => {
      // Soft delete all child categories recursively
      const allChildIds = await this.categoryRepository.getAllChildIds(id, tenantId);
      if (allChildIds.length > 0) {
        await tx.category.updateMany({
          where: { id: { in: allChildIds } },
          data: {
            isActive: false,
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        // Set categoryId to null for products in deleted child categories
        await tx.product.updateMany({
          where: { categoryId: { in: allChildIds }, isDeleted: false },
          data: { categoryId: null },
        });
      }

      // Set categoryId to null for products in this category
      await tx.product.updateMany({
        where: { categoryId: id, isDeleted: false },
        data: { categoryId: null },
      });

      // Soft delete the category itself
      await tx.category.update({
        where: { id },
        data: {
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });

    return { success: true, message: 'Category and subcategories soft deleted. Products moved to uncategorized.' };
  }

  // Restore a soft-deleted category
  async restoreCategory(id, tenantId) {
    const category = await this.categoryRepository.findByIdAndTenant(id, tenantId);

    if (!category) {
      throw new Error('Category not found');
    }

    if (!category.isDeleted) {
      throw new Error('Category is not deleted');
    }

    // Check if slug is still available for active categories
    const slugConflict = await this.categoryRepository.findBySlugActive(category.slug, tenantId, id);
    if (slugConflict) {
      throw new Error(`Cannot restore: slug "${category.slug}" is now used by another active category`);
    }

    // Check if parent category is active (if has parent)
    if (category.parentId) {
      const parentCategory = await this.categoryRepository.findActiveByIdAndTenant(category.parentId, tenantId);
      if (!parentCategory) {
        // Set parent to null if parent is deleted
        await this.categoryRepository.update(id, { parentId: null });
      }
    }

    return await this.categoryRepository.restore(id);
  }

  // Get category by ID (for admin - includes deleted categories with indicator)
  async getCategoryByIdAdmin(id, tenantId) {
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
    const recursiveCount = await this.calculateRecursiveProductCount(category.id, tenantId, true);

    return {
      ...category,
      _recursiveCount: recursiveCount,
    };
  }
}
