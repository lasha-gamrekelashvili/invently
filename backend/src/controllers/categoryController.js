import { CategoryService } from '../services/CategoryService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const categoryService = new CategoryService();

const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parentId, isActive = true } = req.validatedData;
    const tenantId = req.tenantId;

    const category = await categoryService.createCategory(
      { name, slug, description, parentId, isActive },
      tenantId
    );

    // Include warning in response if category name matches deleted category
    const response = ApiResponse.created(category, 'Category created successfully');
    if (category._warning) {
      response.warning = category._warning;
      delete category._warning;
    }

    res.status(201).json(response);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(ApiResponse.error('Category slug already exists in this store'));
    }
    if (error.message === 'Parent category not found') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Slug already exists for another active category') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Create category error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getCategories = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = req.validatedQuery;

    const result = await categoryService.getCategories(
      tenantId,
      { sortBy, sortOrder, search },
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const category = await categoryService.getCategoryById(id, tenantId);

    if (!category) {
      return res.status(404).json(ApiResponse.notFound('Category'));
    }

    res.json(ApiResponse.success(category));
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentId, isActive } = req.validatedData;
    const tenantId = req.tenantId;

    const category = await categoryService.updateCategory(
      id,
      { name, slug, description, parentId, isActive },
      tenantId
    );

    res.json(ApiResponse.updated(category, 'Category updated successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(ApiResponse.error('Category slug already exists in this store'));
    }
    if (error.message === 'Category not found') {
      return res.status(404).json(ApiResponse.notFound('Category'));
    }
    if (error.message === 'Category cannot be its own parent' || error.message === 'Parent category not found') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Cannot update a deleted category. Restore it first.') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Slug already exists for another active category') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Update category error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const result = await categoryService.deleteCategory(id, tenantId);

    res.json(ApiResponse.deleted(result.message || 'Category soft deleted successfully'));
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json(ApiResponse.notFound('Category'));
    }
    if (error.message === 'Category is already deleted') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Delete category error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const category = await categoryService.restoreCategory(id, tenantId);

    res.json(ApiResponse.updated(category, 'Category restored successfully'));
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json(ApiResponse.notFound('Category'));
    }
    if (error.message === 'Category is not deleted') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message.includes('Cannot restore')) {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Restore category error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  restoreCategory
};
