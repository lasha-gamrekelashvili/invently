const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to calculate recursive product count for a category
const calculateRecursiveProductCount = async (categoryId, tenantId) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, tenantId, deletedAt: null },
    include: {
      children: {
        where: {
          deletedAt: null
        }
      },
      _count: {
        select: {
          products: {
            where: {
              status: 'ACTIVE',
              deletedAt: null
            }
          }
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

const getStoreInfo = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      id: req.tenant.id,
      name: req.tenant.name,
      subdomain: req.tenant.subdomain,
      description: req.tenant.description
    });
  } catch (error) {
    console.error('Get store info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPublicCategories = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const categories = await prisma.category.findMany({
      where: {
        tenantId: req.tenant.id,
        isActive: true,
        deletedAt: null
      },
      include: {
        children: {
          where: {
            isActive: true,
            deletedAt: null
          }
        },
        _count: {
          select: {
            products: {
              where: {
                status: 'ACTIVE',
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Add recursive counts to all categories
    const categoriesWithRecursiveCounts = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        _recursiveCount: await calculateRecursiveProductCount(category.id, req.tenant.id)
      }))
    );

    res.json(categoriesWithRecursiveCounts);
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to get all category IDs including children recursively
const getRecursiveCategoryIds = async (categoryId, tenantId) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, tenantId, deletedAt: null },
    include: { children: true }
  });

  if (!category) return [categoryId];

  const allIds = [categoryId];
  
  // Recursively get all child category IDs
  for (const child of category.children) {
    const childIds = await getRecursiveCategoryIds(child.id, tenantId);
    allIds.push(...childIds);
  }

  return allIds;
};

const getPublicProducts = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { page = 1, limit = 20, categoryId, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let categoryIds = null;
    if (categoryId) {
      categoryIds = await getRecursiveCategoryIds(categoryId, req.tenant.id);
    }

    const where = {
      tenantId: req.tenant.id,
      status: 'ACTIVE',
      deletedAt: null,
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      ...((minPrice && maxPrice) && { price: { gte: parseFloat(minPrice), lte: parseFloat(maxPrice) } })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          images: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' }
          },
          variants: {
            where: { deletedAt: null, isActive: true },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get public products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPublicProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!req.tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const product = await prisma.product.findFirst({
      where: {
        slug,
        tenantId: req.tenant.id,
        status: 'ACTIVE',
        deletedAt: null
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
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { deletedAt: null, isActive: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get public product by slug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    if (!req.tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const category = await prisma.category.findFirst({
      where: {
        slug: categorySlug,
        tenantId: req.tenant.id,
        isActive: true,
        deletedAt: null
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const where = {
      categoryId: category.id,
      tenantId: req.tenant.id,
      status: 'ACTIVE',
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          images: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' }
          },
          variants: {
            where: { deletedAt: null, isActive: true },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      category,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getStoreInfo,
  getPublicCategories,
  getPublicProducts,
  getPublicProductBySlug,
  getProductsByCategory
};