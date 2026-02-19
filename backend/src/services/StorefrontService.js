import { CategoryService } from './CategoryService.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import { BOGPaymentService } from './BOGPaymentService.js';
import { OrderService } from './OrderService.js';
import prisma from '../repositories/BaseRepository.js';

export class StorefrontService {
  constructor() {
    this.categoryService = new CategoryService();
    this.productRepository = new ProductRepository();
    this.bogPayment = process.env.BOG_CLIENT_ID && process.env.BOG_CLIENT_SECRET
      ? new BOGPaymentService()
      : null;
    this.orderService = new OrderService();
  }

  /**
   * Gets order status for checkout success/fail page (public, tenant-scoped)
   */
  async getOrderStatus(orderId, tenantId) {
    if (!tenantId) throw new Error('Store not found');
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: { orderNumber: true, paymentStatus: true },
    });
    if (!order) throw new Error('Order not found');
    return order;
  }

  /**
   * Gets BOG payment failure details for display on checkout fail page.
   * Returns reject_reason, payment code, code_description when available.
   */
  async getPaymentFailureDetails(orderId, tenantId) {
    console.info('[Payment failure details] Requested', { orderId, tenantId: tenantId ?? 'none' });
    if (!tenantId) throw new Error('Store not found');
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: { bogOrderId: true, paymentStatus: true },
    });
    if (!order) {
      console.warn('[Payment failure details] Order not found', { orderId, tenantId });
      throw new Error('Order not found');
    }
    if (!order.bogOrderId) {
      console.info('[Payment failure details] No bogOrderId (mock flow or non-BOG order)', { orderId });
      return null;
    }
    if (!this.bogPayment) {
      console.info('[Payment failure details] BOG not configured', { orderId });
      return null;
    }
    try {
      const details = await this.bogPayment.getPaymentDetails(order.bogOrderId);
      if (!details) {
        console.warn('[Payment failure details] BOG returned null/404', { orderId, bogOrderId: order.bogOrderId });
        return null;
      }
      const statusKey = details.order_status?.key;
      const rejectReason = details.reject_reason ?? null;
      const code = details.payment_detail?.code ?? null;
      const codeDesc = details.payment_detail?.code_description ?? null;
      console.info('[Payment failure details] BOG status', {
        orderId,
        bogOrderId: order.bogOrderId,
        order_status: statusKey,
        reject_reason: rejectReason,
        payment_code: code,
        code_description: codeDesc,
      });
      if (statusKey !== 'rejected') {
        console.info('[Payment failure details] Order is not rejected in BOG', { statusKey });
        // BOG redirect can send user to fail even when payment succeeded; finalize order and let fail page redirect to success
        if (statusKey === 'completed') {
          try {
            await this.orderService.finalizeOrderAfterPayment(orderId);
            console.info('[Payment failure details] Finalized order (callback may not have reached us)', { orderId });
          } catch (err) {
            console.warn('[Payment failure details] Finalize failed', { orderId, err: err.message });
          }
        }
        return { order_status: statusKey };
      }
      return {
        order_status: statusKey,
        reject_reason: rejectReason,
        payment_code: code,
        code_description: codeDesc,
      };
    } catch (err) {
      console.warn('[Payment failure details] BOG API error', { orderId, bogOrderId: order.bogOrderId, err: err.message });
      return null;
    }
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
