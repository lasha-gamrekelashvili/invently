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

export const orderByPatterns = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  updated: { updatedAt: 'desc' },
  alphabetical: { title: 'asc' },
  priceAsc: { price: 'asc' },
  priceDesc: { price: 'desc' },
  sortOrder: { sortOrder: 'asc' },
};

export function buildPagination(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

export function buildProductFilters({ categoryId, isActive, isDeleted, minPrice, maxPrice, search, tenantId, includeDeleted = false }) {
  const where = {};

  if (tenantId) where.tenantId = tenantId;
  if (categoryId) where.categoryId = categoryId;
  if (isActive !== undefined) where.isActive = isActive;
  
  if (isDeleted !== undefined) {
    where.isDeleted = isDeleted;
  } else if (!includeDeleted) {
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
