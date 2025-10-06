import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, mediaAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDropdown from '../components/CustomDropdown';
import FormSkeleton from '../components/FormSkeleton';
import AttributesEditor from '../components/AttributesEditor';
import VariantManager from '../components/VariantManager';
import { ProductVariant } from '../types';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ProductForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stockQuantity: '',
    categoryId: '',
    status: 'DRAFT' as 'ACTIVE' | 'DRAFT'
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
        status: existingProduct.status as 'ACTIVE' | 'DRAFT',
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
    if (!categoriesData?.categories) return [{ value: '', label: 'Select a category' }];
    
    return [
      { value: '', label: 'Select a category' },
      ...categoriesData.categories.map((category) => ({
        value: category.id,
        label: category.name,
      }))
    ];
  }, [categoriesData?.categories]);

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const product = await productsAPI.create(data);
      
      // Upload images for new product
      if (images.length > 0) {
        const uploadPromises = images
          .filter(img => img.file) // Only upload temp images with files
          .map(img => mediaAPI.uploadProductImage(product.id, img.file));
        
        await Promise.all(uploadPromises);
      }
      
      return product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleSuccess(`Product "${data.title}" created successfully`);
      navigate('/admin/products');
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error, 'Failed to create product');
      setError(errorMessage);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: any) => productsAPI.update(id!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      handleSuccess(`Product "${data.title}" updated successfully`);
      navigate('/admin/products');
    },
    onError: (error: any) => {
      const errorMessage = handleApiError(error, 'Failed to update product');
      setError(errorMessage);
    }
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (isEditing && id) {
          // Upload to existing product
          return await mediaAPI.uploadProductImage(id, file);
        } else {
          // For new products, we'll store the file temporarily
          return {
            id: `temp-${Date.now()}-${Math.random()}`,
            url: URL.createObjectURL(file),
            altText: '',
            filename: file.name,
            file: file
          };
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedImages]);
      handleSuccess('Images uploaded successfully');
    } catch (error) {
      handleApiError(error, 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  }, [isEditing, id]);

  const handleRemoveImage = useCallback(async (imageId: string) => {
    try {
      if (isEditing && !imageId.startsWith('temp-')) {
        await mediaAPI.deleteProductImage(imageId);
      }
      setImages(prev => prev.filter(img => img.id !== imageId));
      handleSuccess('Image removed successfully');
    } catch (error) {
      handleApiError(error, 'Failed to remove image');
    }
  }, [isEditing]);

  const generateSlug = useCallback((title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
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
      status: formData.status,
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
          Back to Products
        </Link>
      </div>

      <div className="card p-8">
        <h1 className="text-3xl font-bold gradient-text mb-8">
          {isEditing ? 'Edit Product' : 'Create New Product'}
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
                Product Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter product title"
              />
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <CustomDropdown
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                options={categoryOptions}
                placeholder="Select a category"
              />
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
              placeholder="Enter product description"
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Images
            </label>
            
            {/* Upload Button */}
            <div className="mb-4">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImages}
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  uploadingImages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                {uploadingImages ? 'Uploading...' : 'Upload Images'}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Upload JPEG, PNG, GIF, or WebP images (max 5MB each)
              </p>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.altText || 'Product image'}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
                Base Price ($) *
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
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">Can be overridden by variant prices</p>
            </div>

            <div>
              <label htmlFor="stockQuantity" className="block text-sm font-semibold text-gray-700 mb-2">
                Base Stock Quantity *
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
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Use 0 if managing stock via variants</p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                Status *
              </label>
              <CustomDropdown
                id="status"
                name="status"
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as 'DRAFT' | 'ACTIVE' }))}
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'ACTIVE', label: 'Active' },
                ]}
                placeholder="Select status"
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
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                <LoadingSpinner size="sm" />
              ) : (
                isEditing ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
