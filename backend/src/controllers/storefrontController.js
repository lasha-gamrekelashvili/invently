import { StorefrontService } from '../services/StorefrontService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const storefrontService = new StorefrontService();

const getStoreInfo = async (req, res) => {
  try {
    const storeInfo = await storefrontService.getStoreInfo(req.tenant);

    res.json(ApiResponse.success(storeInfo));
  } catch (error) {
    if (error.message === 'Store not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    console.error('Get store info error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getPublicCategories = async (req, res) => {
  try {
    const categories = await storefrontService.getPublicCategories(req.tenant?.id);

    res.json(ApiResponse.success(categories));
  } catch (error) {
    if (error.message === 'Store not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    console.error('Get public categories error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getPublicProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, categoryId, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const result = await storefrontService.getPublicProducts(
      req.tenant?.id,
      { categoryId, search, minPrice, maxPrice, sortBy, sortOrder },
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    if (error.message === 'Store not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    console.error('Get public products error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getPublicProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await storefrontService.getPublicProductBySlug(slug, req.tenant?.id);

    res.json(ApiResponse.success(product));
  } catch (error) {
    if (error.message === 'Store not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    console.error('Get public product by slug error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const result = await storefrontService.getProductsByCategory(
      categorySlug,
      req.tenant?.id,
      { search, sortBy, sortOrder },
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    if (error.message === 'Store not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Category not found') {
      return res.status(404).json(ApiResponse.notFound('Category'));
    }
    console.error('Get products by category error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await storefrontService.getOrderStatus(id, req.tenant?.id);
    res.json(ApiResponse.success(order));
  } catch (error) {
    if (error.message === 'Store not found' || error.message === 'Order not found') {
      return res.status(404).json(ApiResponse.notFound(error.message));
    }
    console.error('Get order status error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getPaymentFailureDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      console.warn('[Payment failure details] No tenant resolved', { orderId: id, host: req.get('x-original-host') || req.get('host') });
    }
    const details = await storefrontService.getPaymentFailureDetails(id, tenantId);
    res.json(ApiResponse.success(details));
  } catch (error) {
    if (error.message === 'Store not found' || error.message === 'Order not found') {
      console.warn('[Payment failure details] Not found', { orderId: req.params.id, error: error.message });
      return res.status(404).json(ApiResponse.notFound(error.message));
    }
    console.error('Get payment failure details error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export {
  getStoreInfo,
  getPublicCategories,
  getPublicProducts,
  getPublicProductBySlug,
  getProductsByCategory,
  getOrderStatus,
  getPaymentFailureDetails,
};