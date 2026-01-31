import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDropdown from '../components/CustomDropdown';
import FormSkeleton from '../components/FormSkeleton';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CategoryForm = () => {
  const { t } = useLanguage();
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
      .filter(cat => {
        // Handle both null and undefined for root categories
        if (parentId === null) {
          return cat.parentId === null || cat.parentId === undefined;
        }
        return cat.parentId === parentId;
      })
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
      handleSuccess(t('categories.createSuccess', { name: data.name }));
      navigate('/admin/categories');
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error, t('categories.createError'));
      setError(errorMessage);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: any) => categoriesAPI.update(id!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      handleSuccess(t('categories.updateSuccess', { name: data.name }));
      navigate('/admin/categories');
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error, t('categories.updateError'));
      setError(errorMessage);
    }
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Georgian to Latin transliteration map
  const georgianToLatin: { [key: string]: string } = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k',
    'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u',
    'ფ': 'f', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch',
    'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
  };

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .split('')
      .map(char => georgianToLatin[char] || char)
      .join('')
      .replace(/[^\p{L}\p{N}\s]/gu, '') // Keep Unicode letters, numbers, and spaces
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <Link
          to="/admin/categories"
          className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
{t('common.back')} {t('navigation.categories')}
        </Link>
      </div>

      <div className="card p-4 sm:p-6 md:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-4 sm:mb-6 md:mb-8">
{isEditing ? t('categories.actions.edit') : t('categories.actions.create')}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
{t('categories.form.name')} *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field"
placeholder={t('categories.form.namePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="parentId" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
{t('categories.form.parentCategory')}
              </label>
              <CustomDropdown
                id="parentId"
                name="parentId"
                value={formData.parentId}
                onChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}
                options={[
                  { value: '', label: t('categories.form.noParent') },
                  ...categoryList.map((category) => ({
                    value: category.id,
                    label: '  '.repeat(category.level) + category.name,
                  }))
                ]}
placeholder={t('categories.form.selectParent')}
              />
              {formData.parentId && (
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-600">
{t('categories.form.parentCategoryHelp')}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
{t('categories.form.description')}
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="input-field resize-none"
placeholder={t('categories.form.descriptionPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="isActive" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
{t('categories.form.status')} *
            </label>
            <CustomDropdown
              id="isActive"
              name="isActive"
              value={formData.isActive.toString()}
              onChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'true' }))}
              options={[
                { value: 'true', label: t('categories.form.active') },
                { value: 'false', label: t('categories.form.draft') },
              ]}
placeholder={t('categories.form.selectStatus')}
              required
            />
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
{t('categories.form.statusHelp')}
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-neutral-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] sm:text-xs font-bold">i</span>
                </div>
              </div>
              <div className="text-xs sm:text-sm">
                <p className="text-neutral-900 font-medium mb-1">{t('categories.form.urlPreview')}</p>
                <p className="text-neutral-600">
                  {t('categories.form.urlPreviewText')} <span className="font-mono bg-neutral-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs break-all">
                    /store/category/{formData.name ? generateSlug(formData.name) : 'category-slug'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 sm:space-x-4 pt-4 sm:pt-6">
            <Link
              to="/admin/categories"
              className="btn-outline"
            >
{t('common.cancel')}
            </Link>
            <button
              type="submit"
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                <LoadingSpinner size="sm" />
              ) : (
isEditing ? t('categories.actions.update') : t('categories.actions.create')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
