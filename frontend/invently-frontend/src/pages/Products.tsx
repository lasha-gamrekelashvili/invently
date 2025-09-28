import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomDropdown from '../components/CustomDropdown';
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.list(),
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

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-600 mt-1">
            {productsData?.pagination.total || 0} products in your store
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Product
        </Link>
      </div>

      {productsData?.products?.length ? (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first product.
            </p>
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