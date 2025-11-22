import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to calculate recursive product count for a category
const calculateRecursiveProductCount = async (categoryId, tenantId) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, tenantId },
    include: {
      children: true,
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!category) return 0;

  let totalCount = category._count.products;

  // Recursively add counts from all children
  for (const child of category.children) {
    totalCount += await calculateRecursiveProductCount(child.id, tenantId);
  }

  return totalCount;
};

// Helper function to add recursive counts to categories
const addRecursiveCounts = async (categories, tenantId) => {
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      _recursiveCount: await calculateRecursiveProductCount(category.id, tenantId)
    }))
  );
  return categoriesWithCounts;
};

// Helper function to get all products in a category and its children recursively
const getRecursiveProducts = async (categoryId, tenantId) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, tenantId },
    include: {
      children: true
    }
  });

  if (!category) return [];

  // Get products directly in this category
  const directProducts = await prisma.product.findMany({
    where: {
      categoryId: categoryId,
      tenantId
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1
      },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  // Get products from all child categories recursively
  const childProducts = await Promise.all(
    category.children.map(child => getRecursiveProducts(child.id, tenantId))
  );

  // Flatten the array of arrays
  const allChildProducts = childProducts.flat();

  // Combine direct products with child products
  return [...directProducts, ...allChildProducts];
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parentId, isActive = true } = req.validatedData;
    const tenantId = req.tenantId;

    if (parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          tenantId
        }
      });

      if (!parentCategory) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId,
        isActive,
        tenantId
      },
      include: {
        parent: true,
        children: true
      }
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category slug already exists in this store' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { page, limit, sortBy = 'createdAt', sortOrder, search } = req.validatedQuery;

    const where = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } }
        ]
      })
    };

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              products: {
                where: {
                  status: 'ACTIVE'
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.category.count({ where })
    ]);

    // Add recursive counts to categories
    const categoriesWithRecursiveCounts = await addRecursiveCounts(categories, tenantId);

    res.json({
      categories: categoriesWithRecursiveCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        parent: true,
        children: true,
        products: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Add recursive product count and all products
    const recursiveCount = await calculateRecursiveProductCount(category.id, tenantId);
    const allProducts = await getRecursiveProducts(category.id, tenantId);
    
    const categoryWithRecursiveCount = {
      ...category,
      _recursiveCount: recursiveCount,
      allProducts: allProducts
    };

    res.json(categoryWithRecursiveCount);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentId, isActive } = req.validatedData;
    const tenantId = req.tenantId;

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (parentId) {
      if (parentId === id) {
        return res.status(400).json({ error: 'Category cannot be its own parent' });
      }

      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          tenantId
        }
      });

      if (!parentCategory) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        parentId,
        isActive
      },
      include: {
        parent: true,
        children: true
      }
    });

    res.json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category slug already exists in this store' });
    }
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        children: true,
        products: true
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.children.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with subcategories' });
    }

    if (category.products.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};