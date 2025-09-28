const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to get all child category IDs recursively
const getAllChildCategoryIds = async (categoryId, tenantId) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, tenantId, deletedAt: null },
    include: {
      children: true
    }
  });

  if (!category) return [];

  let allIds = [categoryId];

  // Recursively get IDs from all children
  for (const child of category.children) {
    const childIds = await getAllChildCategoryIds(child.id, tenantId);
    allIds = [...allIds, ...childIds];
  }

  return allIds;
};

const createProduct = async (req, res) => {
  try {
    const { title, description, slug, price, stockQuantity, status, categoryId } = req.validatedData;
    const tenantId = req.tenantId;

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          tenantId,
          deletedAt: null
        }
      });

      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        slug,
        price,
        stockQuantity,
        status,
        categoryId,
        tenantId
      },
      include: {
        category: true,
        images: true
      }
    });


    res.status(201).json(product);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product slug already exists in this store' });
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProducts = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { page, limit, sortBy = 'createdAt', sortOrder, search, categoryId, status, minPrice, maxPrice } = req.validatedQuery;

    // Handle hierarchical category filtering
    let categoryFilter = {};
    if (categoryId) {
      const allCategoryIds = await getAllChildCategoryIds(categoryId, tenantId);
      categoryFilter = {
        categoryId: {
          in: allCategoryIds
        }
      };
    }

    const where = {
      tenantId,
      deletedAt: null,
      ...categoryFilter,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Handle price range filter properly
    if (minPrice && maxPrice) {
      where.price = {
        gte: parseFloat(minPrice),
        lte: parseFloat(maxPrice)
      };
    } else if (minPrice) {
      where.price = { gte: parseFloat(minPrice) };
    } else if (maxPrice) {
      where.price = { lte: parseFloat(maxPrice) };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tenantId = req.tenantId;

    const product = await prisma.product.findFirst({
      where: {
        slug,
        tenantId,
        deletedAt: null,
        status: 'ACTIVE'
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, slug, price, stockQuantity, status, categoryId } = req.validatedData;
    const tenantId = req.tenantId;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          tenantId,
          deletedAt: null
        }
      });

      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (slug !== undefined) updateData.slug = slug;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (status !== undefined) updateData.status = status;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });


    res.json(product);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product slug already exists in this store' });
    }
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });


    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct
};