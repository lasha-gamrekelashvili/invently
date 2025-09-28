import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, debounce } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomDropdown from '../components/CustomDropdown';
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { Product } from '../types';

const Products = () => {
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });

  // Inline editing state
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    price: string;
    stockQuantity: string;
    status: string;
  }>({
    price: '',
    stockQuantity: '',
    status: '',
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const debouncedSetSearchQuery = useMemo(
    () => debounce(setSearchQuery, 300),
    []
  );

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchQuery, statusFilter, categoryFilter, minPrice, maxPrice],
    queryFn: () => productsAPI.list({
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      categoryId: categoryFilter || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteModal({ isOpen: false, product: null });
      handleSuccess('Product deleted successfully');
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to delete product');
    },
  });

  const handleEditProduct = (product: Product) => {
    navigate(`/admin/products/${product.id}/edit`);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteModal({ isOpen: true, product });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.product) {
      deleteMutation.mutate(deleteModal.product.id);
    }
  };

  // Inline editing functions
  const handleStartEdit = (product: Product) => {
    setEditingProduct(product.id);
    setEditValues({
      price: product.price.toString(),
      stockQuantity: product.stockQuantity.toString(),
      status: product.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditValues({
      price: '',
      stockQuantity: '',
      status: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      const productData = {
        price: parseFloat(editValues.price),
        stockQuantity: parseInt(editValues.stockQuantity),
        status: editValues.status as 'ACTIVE' | 'DRAFT',
      };

      await productsAPI.update(editingProduct, productData);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
      handleSuccess('Product updated successfully');
    } catch (error) {
      handleApiError(error, 'Failed to update product');
    }
  };

  const handleEditValueChange = (field: string, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleProductClick = (product: Product) => {
    if (editingProduct !== product.id) {
      handleEditProduct(product);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSearchInput('');
    setStatusFilter('');
    setCategoryFilter('');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters = searchQuery || statusFilter || categoryFilter || minPrice || maxPrice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CubeIcon className="h-8 w-8 mr-3 text-blue-600" />
            Products
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {productsData?.pagination.total || 0} products in your store
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSetSearchQuery(e.target.value);
                }}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DRAFT', label: 'Draft' },
              ]}
              placeholder="Status"
            />
          </div>

          {/* Category Filter */}
          <div>
            <CustomDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: '', label: 'All Categories' },
                ...(categoriesData?.categories?.map(cat => ({
                  value: cat.id,
                  label: cat.name
                })) || [])
              ]}
              placeholder="Category"
            />
          </div>

          {/* Price Range */}
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input-field text-sm"
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input-field text-sm"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors duration-200"
            >
              <XCircleIcon className="h-3 w-3 mr-1" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        </div>
      ) : productsData?.products?.length ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productsData.products.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-gray-50 ${editingProduct !== product.id ? 'cursor-pointer' : ''}`}
                    onClick={() => handleProductClick(product)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.images?.[0] ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={product.images[0].url}
                              alt={product.images[0].altText || product.title}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <CubeIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                            {product.title}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingProduct === product.id ? (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-1">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValues.price}
                            onChange={(e) => handleEditValueChange('price', e.target.value)}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-16"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">${product.price}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingProduct === product.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editValues.stockQuantity}
                          onChange={(e) => handleEditValueChange('stockQuantity', e.target.value)}
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-16"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{product.stockQuantity}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No category</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingProduct === product.id ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <CustomDropdown
                            value={editValues.status}
                            onChange={(value) => handleEditValueChange('status', value)}
                            options={[
                              { value: 'ACTIVE', label: 'ACTIVE' },
                              { value: 'DRAFT', label: 'DRAFT' },
                            ]}
                            size="compact"
                            className="w-16"
                          />
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        {editingProduct === product.id ? (
                          <>
                            <button 
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-700 p-1 rounded"
                              title="Save changes"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded"
                              title="Cancel editing"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(product);
                              }}
                              className="text-gray-400 hover:text-blue-600 p-1 rounded"
                              title="Edit product inline"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product);
                              }}
                              className="text-gray-400 hover:text-red-600 p-1 rounded"
                              title="Delete product"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CubeIcon className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first product.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={
          deleteModal.product 
            ? `Are you sure you want to delete "${deleteModal.product.title}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
        type="danger"
      />
    </div>
  );
};

export default Products;