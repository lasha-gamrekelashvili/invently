import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, mediaAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDropdown from '../components/CustomDropdown';
import FormSkeleton from '../components/FormSkeleton';
import AttributesEditor from '../components/AttributesEditor';
import VariantManager from '../components/VariantManager';
import ImageUploader from '../components/ImageUploader';
import { ProductVariant } from '../types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ProductForm = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;
  const categoryIdFromUrl = searchParams.get('categoryId');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stockQuantity: '',
    categoryId: categoryIdFromUrl || '',
    isActive: false // false = Draft, true = Active
  });
  const [error, setError] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch categories for the dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch existing product when editing
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getById(id!),
    enabled: isEditing,
  });

  // Fetch existing images when editing
  const { data: existingImages } = useQuery({
    queryKey: ['product-images', id],
    queryFn: () => mediaAPI.getProductImages(id!),
    enabled: isEditing && !!id,
  });

  // Update form data when existing product is loaded
  useEffect(() => {
    if (existingProduct && isEditing) {
      setFormData({
        title: existingProduct.title,
        description: existingProduct.description || '',
        price: existingProduct.price.toString(),
        stockQuantity: existingProduct.stockQuantity.toString(),
        categoryId: existingProduct.categoryId || '',
        isActive: existingProduct.isActive ?? false,
      });
      setAttributes(existingProduct.attributes || {});
      setVariants(existingProduct.variants || []);
    }
  }, [existingProduct, isEditing]);

  // Update images when existing images are loaded
  useEffect(() => {
    if (existingImages) {
      setImages(existingImages);
    }
  }, [existingImages]);

  // Memoized category options to prevent unnecessary recalculations
  const categoryOptions = useMemo(() => {
    if (!categoriesData?.categories) return [{ value: '', label: t('products.form.selectCategory') }];
    
    return [
      { value: '', label: t('products.form.selectCategory') },
      ...categoriesData.categories.map((category) => ({
        value: category.id,
        label: category.name,
      }))
    ];
  }, [categoriesData?.categories, t]);

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const product = await productsAPI.create(data);
      
      // Upload images for new product
      if (images.length > 0) {
        const uploadPromises = images.map(async (img) => {
          if (img.file) {
            // Upload file-based images
            return await mediaAPI.uploadProductImage(product.id, img.file);
          } else if (img.isUrl) {
            // Add URL-based images
            return await mediaAPI.addProductImageByUrl(product.id, img.url, img.altText);
          }
          return null;
        }).filter(Boolean);
        
        await Promise.all(uploadPromises);
      }
      
      return product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleSuccess(t('products.createSuccess', { title: data.title }));
      navigate('/admin/products');
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error, t('products.createError'));
      setError(errorMessage);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: any) => productsAPI.update(id!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      handleSuccess(t('products.updateSuccess', { title: data.title }));
      navigate('/admin/products');
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error, t('products.updateError'));
      setError(errorMessage);
    }
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleImageUpload = useCallback(async (files: FileList, altText?: string) => {
    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (isEditing && id) {
          // Upload to existing product
          return await mediaAPI.uploadProductImage(id, file, altText);
        } else {
          // For new products, we'll store the file temporarily
          return {
            id: `temp-${Date.now()}-${Math.random()}`,
            url: URL.createObjectURL(file),
            altText: altText || '',
            filename: file.name,
            file: file
          };
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedImages]);
      
      // Invalidate product queries to refresh the products list
      if (isEditing && id) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
        queryClient.invalidateQueries({ queryKey: ['product-images', id] });
      }
      
      handleSuccess(t('products.images.uploadSuccess'));
    } catch (error) {
      handleApiError(error, t('products.images.uploadError'));
    } finally {
      setUploadingImages(false);
    }
  }, [isEditing, id, queryClient]);

  const handleImageAddByUrl = useCallback(async (url: string, altText?: string) => {
    try {
      if (isEditing && id) {
        // Add to existing product
        const newImage = await mediaAPI.addProductImageByUrl(id, url, altText);
        setImages(prev => [...prev, newImage]);
        
        // Invalidate product queries to refresh the products list
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
        queryClient.invalidateQueries({ queryKey: ['product-images', id] });
        
        handleSuccess(t('products.images.addSuccess'));
      } else {
        // For new products, add temporarily
        const tempImage = {
          id: `temp-url-${Date.now()}-${Math.random()}`,
          url: url,
          altText: altText || '',
          filename: url.split('/').pop() || 'image',
          isUrl: true
        };
        setImages(prev => [...prev, tempImage]);
        handleSuccess(t('products.images.addSuccess'));
      }
    } catch (error) {
      handleApiError(error, t('products.images.addError'));
    }
  }, [isEditing, id, queryClient]);

  const handleRemoveImage = useCallback(async (imageId: string) => {
    try {
      if (isEditing && !imageId.startsWith('temp-')) {
        await mediaAPI.deleteProductImage(imageId);
        // Invalidate product queries to refresh the products list
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
        queryClient.invalidateQueries({ queryKey: ['product-images', id] });
      }
      setImages(prev => prev.filter(img => img.id !== imageId));
      handleSuccess(t('products.images.removeSuccess'));
    } catch (error) {
      handleApiError(error, t('products.images.removeError'));
    }
  }, [isEditing, id, queryClient]);

  // Georgian to Latin transliteration map
  const georgianToLatin: { [key: string]: string } = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k',
    'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u',
    'ფ': 'f', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch',
    'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
  };

  const generateSlug = useCallback((title: string) => {
    return title
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

    const slug = generateSlug(formData.title);
    const productData: any = {
      title: formData.title,
      description: formData.description || undefined,
      slug,
      price: parseFloat(formData.price),
      stockQuantity: parseInt(formData.stockQuantity),
      isActive: formData.isActive,
      categoryId: formData.categoryId || undefined,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined
    };

    // For new products, include variants in create request
    if (!isEditing && variants.length > 0) {
      productData.variants = variants.map(v => ({
        sku: v.sku,
        options: v.options,
        price: v.price,
        stockQuantity: v.stockQuantity,
        isActive: v.isActive
      }));
    }

    if (isEditing) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  }, [formData, attributes, variants, generateSlug, isEditing, updateProductMutation, createProductMutation]);

  // Show skeleton while loading categories, product, or images
  if (isLoadingCategories || (isEditing && isLoadingProduct)) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/admin/products"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
{t('common.back')} {t('navigation.products')}
        </Link>
      </div>

      <div className="card p-8">
        <h1 className="text-3xl font-bold gradient-text mb-8">
{isEditing ? t('products.actions.edit') : t('products.actions.create')}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
{t('products.form.title')} *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="input-field"
placeholder={t('products.form.titlePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 mb-2">
{t('products.form.category')}
              </label>
              <CustomDropdown
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                options={categoryOptions}
placeholder={t('products.form.selectCategory')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
{t('products.form.description')}
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="input-field resize-none"
placeholder={t('products.form.descriptionPlaceholder')}
            />
          </div>

          {/* Image Upload Section */}
          <ImageUploader
            images={images}
            onImageUpload={handleImageUpload}
            onImageAddByUrl={handleImageAddByUrl}
            onImageRemove={handleRemoveImage}
            isUploading={uploadingImages}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
{t('products.form.basePrice')} *
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={handleChange}
                className="input-field"
placeholder={t('products.form.basePricePlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('products.form.basePriceHelp')}</p>
            </div>

            <div>
              <label htmlFor="stockQuantity" className="block text-sm font-semibold text-gray-700 mb-2">
{t('products.form.stockQuantity')} *
              </label>
              <input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                min="0"
                required
                value={formData.stockQuantity}
                onChange={handleChange}
                className="input-field"
placeholder={t('products.form.stockQuantityPlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('products.form.stockQuantityHelp')}</p>
            </div>

            <div>
              <label htmlFor="isActive" className="block text-sm font-semibold text-gray-700 mb-2">
{t('products.form.status')} *
              </label>
              <CustomDropdown
                id="isActive"
                name="isActive"
                value={formData.isActive ? 'true' : 'false'}
                onChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'true' }))}
                options={[
                  { value: 'false', label: t('products.form.draft') },
                  { value: 'true', label: t('products.form.active') },
                ]}
placeholder={t('products.form.selectStatus')}
                required
              />
            </div>
          </div>

          {/* Custom Attributes */}
          <div className="border-t pt-6">
            <AttributesEditor
              attributes={attributes}
              onChange={setAttributes}
            />
          </div>

          {/* Product Variants */}
          <div className="border-t pt-6">
            <VariantManager
              productId={id}
              variants={variants}
              onVariantsChange={setVariants}
              isCreating={!isEditing}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6">
            <Link
              to="/admin/products"
              className="btn-outline"
            >
{t('common.cancel')}
            </Link>
            <button
              type="submit"
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                <LoadingSpinner size="sm" />
              ) : (
isEditing ? t('products.actions.update') : t('products.actions.create')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
