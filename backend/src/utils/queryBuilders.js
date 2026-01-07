// Reusable Prisma query fragments

export const productIncludes = {
  withImages: {
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  },

  withFirstImage: {
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
    },
  },

  withVariants: {
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  },

  withCategory: {
    include: {
      category: true,
    },
  },

  full: {
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
  },

  fullWithFirstImage: {
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  },
};

export const cartItemIncludes = {
  withProduct: {
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      },
      variant: true,
    },
  },

  full: {
    include: {
      product: {
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      },
      variant: true,
    },
  },
};

export const orderIncludes = {
  withItems: {
    include: {
      items: true,
    },
  },

  full: {
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          },
          variant: true,
        },
      },
    },
  },
};

export const categoryIncludes = {
  withParent: {
    include: {
      parent: true,
    },
  },

  withChildren: {
    include: {
      children: true,
    },
  },

  // Active children only (non-deleted)
  withActiveChildren: {
    include: {
      children: {
        where: { isDeleted: false },
      },
    },
  },

  withProducts: {
    include: {
      products: true,
    },
  },

  // Active products only (non-deleted)
  withActiveProducts: {
    include: {
      products: {
        where: { isDeleted: false },
      },
    },
  },

  full: {
    include: {
      parent: true,
      children: true,
      products: true,
    },
  },

  // Full with active items only
  fullActive: {
    include: {
      parent: true,
      children: {
        where: { isDeleted: false },
      },
      products: {
        where: { isDeleted: false },
      },
    },
  },
};

// Common ordering patterns
export const orderByPatterns = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  updated: { updatedAt: 'desc' },
  alphabetical: { title: 'asc' },
  priceAsc: { price: 'asc' },
  priceDesc: { price: 'desc' },
  sortOrder: { sortOrder: 'asc' },
};

// Pagination helper
export function buildPagination(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

// Filter builders
export function buildProductFilters({ categoryId, isActive, isDeleted, minPrice, maxPrice, search, tenantId, includeDeleted = false }) {
  const where = {};

  if (tenantId) where.tenantId = tenantId;
  if (categoryId) where.categoryId = categoryId; // UUID string, don't parse as int
  if (isActive !== undefined) where.isActive = isActive;
  
  // Handle isDeleted filter - explicit value takes precedence
  if (isDeleted !== undefined) {
    where.isDeleted = isDeleted;
  } else if (!includeDeleted) {
    // By default, exclude deleted products unless includeDeleted is true
    where.isDeleted = false;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = parseFloat(minPrice);
    if (maxPrice !== undefined) where.price.lte = parseFloat(maxPrice);
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export function buildCategoryFilters({ isActive, search, tenantId, includeDeleted = false }) {
  const where = {};

  if (tenantId) where.tenantId = tenantId;
  if (isActive !== undefined) where.isActive = isActive;

  // By default, exclude deleted categories
  if (!includeDeleted) {
    where.isDeleted = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}
