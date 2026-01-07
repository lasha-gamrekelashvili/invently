import { ProductService } from '../services/ProductService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const productService = new ProductService();

const createProduct = async (req, res) => {
  try {
    const { title, description, slug, sku, price, stockQuantity, isActive, categoryId, attributes, variants } = req.validatedData;
    const tenantId = req.tenantId;

    const product = await productService.createProduct(
      { title, description, slug, sku, price, stockQuantity, isActive, categoryId, attributes, variants },
      tenantId
    );

    // Include warning in response if product name matches deleted product
    const response = ApiResponse.created(product, 'Product created successfully');
    if (product._warning) {
      response.warning = product._warning;
      delete product._warning;
    }

    res.status(201).json(response);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(ApiResponse.error('Product slug or SKU already exists in this store'));
    }
    if (error.message === 'Category not found') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message.startsWith('SKU already exists')) {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Slug already exists for another active product') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Create product error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getProducts = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, categoryId, isActive, isDeleted, minPrice, maxPrice } = req.validatedQuery;

    const result = await productService.getProducts(
      tenantId,
      { sortBy, sortOrder, search, categoryId, isActive, isDeleted, minPrice, maxPrice },
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const product = await productService.getProductById(id, tenantId);

    if (!product) {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }

    res.json(ApiResponse.success(product));
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tenantId = req.tenantId;

    const product = await productService.getProductBySlug(slug, tenantId, true);

    if (!product) {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }

    res.json(ApiResponse.success(product));
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, slug, sku, price, stockQuantity, categoryId, attributes, isActive } = req.validatedData;
    const tenantId = req.tenantId;

    const product = await productService.updateProduct(
      id,
      { title, description, slug, sku, price, stockQuantity, categoryId, attributes, isActive },
      tenantId
    );

    res.json(ApiResponse.updated(product, 'Product updated successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(ApiResponse.error('Product slug or SKU already exists in this store'));
    }
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    if (error.message === 'Category not found') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Cannot update a deleted product. Restore it first.') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message.startsWith('SKU already exists')) {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Slug already exists for another active product') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Update product error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    await productService.deleteProduct(id, tenantId);

    res.json(ApiResponse.deleted('Product soft deleted successfully'));
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    if (error.message === 'Product is already deleted') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Delete product error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const product = await productService.restoreProduct(id, tenantId);

    res.json(ApiResponse.updated(product, 'Product restored successfully'));
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    if (error.message === 'Product is not deleted') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message.includes('Cannot restore')) {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Restore product error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

// Variant management functions
const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sku, options, price, stockQuantity, isActive } = req.validatedData;
    const tenantId = req.tenantId;

    const variant = await productService.createVariant(
      productId,
      { sku, options, price, stockQuantity, isActive },
      tenantId
    );

    res.status(201).json(ApiResponse.created(variant, 'Variant created successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(ApiResponse.error('SKU already exists'));
    }
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    console.error('Create variant error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { sku, options, price, stockQuantity, isActive } = req.validatedData;
    const tenantId = req.tenantId;

    const variant = await productService.updateVariant(
      productId,
      variantId,
      { sku, options, price, stockQuantity, isActive },
      tenantId
    );

    res.json(ApiResponse.updated(variant, 'Variant updated successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(ApiResponse.error('SKU already exists'));
    }
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    if (error.message === 'Variant not found') {
      return res.status(404).json(ApiResponse.notFound('Variant'));
    }
    console.error('Update variant error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const deleteVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const tenantId = req.tenantId;

    await productService.deleteVariant(productId, variantId, tenantId);

    res.json(ApiResponse.deleted('Variant deleted successfully'));
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    if (error.message === 'Variant not found') {
      return res.status(404).json(ApiResponse.notFound('Variant'));
    }
    console.error('Delete variant error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  restoreProduct,
  createVariant,
  updateVariant,
  deleteVariant
};
