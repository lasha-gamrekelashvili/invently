import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to get all child category IDs recursively
const getAllChildCategoryIds = async (categoryId, tenantId) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, tenantId },
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
    const { title, description, slug, price, stockQuantity, status, categoryId, attributes, variants } = req.validatedData;
    const tenantId = req.tenantId;

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          tenantId
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
        tenantId,
        ...(attributes && { attributes }),
        ...(variants && variants.length > 0 && {
          variants: {
            create: variants.map(v => {
              const variantData = {
                options: v.options,
                stockQuantity: v.stockQuantity || 0,
                isActive: v.isActive !== undefined ? v.isActive : true
              };

              // Only add optional fields if they have values
              if (v.sku) variantData.sku = v.sku;
              if (v.price !== undefined && v.price !== null) variantData.price = v.price;

              return variantData;
            })
          }
        })
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product slug already exists in this store' });
    }
    console.error('Create product error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
          },
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
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
        tenantId
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          orderBy: { createdAt: 'asc' }
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
        status: 'ACTIVE'
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
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
    const { title, description, slug, price, stockQuantity, status, categoryId, attributes } = req.validatedData;
    const tenantId = req.tenantId;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          tenantId
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
    if (attributes !== undefined) updateData.attributes = attributes;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          orderBy: { createdAt: 'asc' }
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
        tenantId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Variant management functions
const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sku, options, price, stockQuantity, isActive } = req.validatedData;
    const tenantId = req.tenantId;

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku,
        options,
        price,
        stockQuantity: stockQuantity || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(variant);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    console.error('Create variant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { sku, options, price, stockQuantity, isActive } = req.validatedData;
    const tenantId = req.tenantId;

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify variant exists and belongs to product
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId
      }
    });

    if (!existingVariant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const updateData = {};
    if (sku !== undefined) updateData.sku = sku;
    if (options !== undefined) updateData.options = options;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (isActive !== undefined) updateData.isActive = isActive;

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData
    });

    res.json(variant);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const tenantId = req.tenantId;

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify variant exists and belongs to product
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId
      }
    });

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    await prisma.productVariant.delete({
      where: { id: variantId }
    });

    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant
};