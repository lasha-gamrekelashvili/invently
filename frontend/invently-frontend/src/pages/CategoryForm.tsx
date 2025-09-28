import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDropdown from '../components/CustomDropdown';
import FormSkeleton from '../components/FormSkeleton';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CategoryForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get('parentId') || '';
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: parentId,
    isActive: true
  });
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch categories for parent selection
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch existing category when editing
  const { data: existingCategory, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesAPI.getById(id!),
    enabled: isEditing,
  });

  // Update form data when existing category is loaded
  useEffect(() => {
    if (existingCategory && isEditing) {
      setFormData({
        name: existingCategory.name,
        description: existingCategory.description || '',
        parentId: existingCategory.parentId || '',
        isActive: existingCategory.isActive,
      });
    }
  }, [existingCategory, isEditing]);

  // Memoized function to build flat list of categories for parent selection
  const buildFlatCategoryList = useCallback((categories: any[], parentId: string | null = null, level = 0): any[] => {
    const result: any[] = [];
    
    categories
      .filter(cat => cat.parentId === parentId)
      .filter(cat => !isEditing || cat.id !== id) // Exclude current category when editing
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(cat => {
        result.push({ ...cat, level });
        result.push(...buildFlatCategoryList(categories, cat.id, level + 1));
      });
    
    return result;
  }, [isEditing, id]);

  // Memoized category list to prevent unnecessary recalculations
  const categoryList = useMemo(() => {
    if (!categoriesData?.categories) return [];
    return buildFlatCategoryList(categoriesData.categories);
  }, [categoriesData?.categories, buildFlatCategoryList]);

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => categoriesAPI.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleSuccess(`Category "${data.name}" created successfully`);
      navigate('/admin/categories');
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error, 'Failed to create category');
      setError(errorMessage);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: any) => categoriesAPI.update(id!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      handleSuccess(`Category "${data.name}" updated successfully`);
      navigate('/admin/categories');
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error, 'Failed to update category');
      setError(errorMessage);
    }
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const generateSlug = useCallback((name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const slug = generateSlug(formData.name);
    const categoryData = {
      name: formData.name,
      slug,
      description: formData.description || undefined,
      parentId: formData.parentId || null,
      isActive: formData.isActive
    };

    if (isEditing) {
      updateCategoryMutation.mutate(categoryData);
    } else {
      createCategoryMutation.mutate(categoryData);
    }
  }, [formData, generateSlug, isEditing, updateCategoryMutation, createCategoryMutation]);

  // Show skeleton while loading categories or existing category
  if (isLoadingCategories || (isEditing && isLoadingCategory)) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/admin/categories"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Categories
        </Link>
      </div>

      <div className="card p-8">
        <h1 className="text-3xl font-bold gradient-text mb-8">
          {isEditing ? 'Edit Category' : 'Create New Category'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label htmlFor="parentId" className="block text-sm font-semibold text-gray-700 mb-2">
                Parent Category
              </label>
              <CustomDropdown
                id="parentId"
                name="parentId"
                value={formData.parentId}
                onChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}
                options={[
                  { value: '', label: 'None (Top Level Category)' },
                  ...categoryList.map((category) => ({
                    value: category.id,
                    label: '  '.repeat(category.level) + category.name,
                  }))
                ]}
                placeholder="Select parent category"
              />
              {formData.parentId && (
                <p className="mt-2 text-sm text-blue-600">
                  This category will be created under the selected parent category.
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="input-field resize-none"
              placeholder="Enter category description"
            />
          </div>

          <div>
            <label htmlFor="isActive" className="block text-sm font-semibold text-gray-700 mb-2">
              Status *
            </label>
            <CustomDropdown
              id="isActive"
              name="isActive"
              value={formData.isActive.toString()}
              onChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'true' }))}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Draft' },
              ]}
              placeholder="Select status"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Draft categories won't be visible in the public store
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-1">Category URL Preview</p>
                <p className="text-blue-700">
                  Your category will be accessible at: <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                    /store/category/{formData.name ? generateSlug(formData.name) : 'category-slug'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6">
            <Link
              to="/admin/categories"
              className="btn-outline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                <LoadingSpinner size="sm" />
              ) : (
                isEditing ? 'Update Category' : 'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
