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

    res.status(201).json(ApiResponse.created(category, 'Category created successfully'));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json(ApiResponse.error('Category slug already exists in this store'));
    }
    if (error.message === 'Parent category not found') {
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
    console.error('Update category error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    await categoryService.deleteCategory(id, tenantId);

    res.json(ApiResponse.deleted('Category deleted successfully'));
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json(ApiResponse.notFound('Category'));
    }
    if (error.message === 'Cannot delete category with subcategories' || error.message === 'Cannot delete category with products') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Delete category error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
