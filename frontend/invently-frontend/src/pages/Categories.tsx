import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI, productsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryTree from '../components/CategoryTree';
import CategoryBreadcrumb from '../components/CategoryBreadcrumb';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomDropdown from '../components/CustomDropdown';
import { PlusIcon, FolderIcon, PencilIcon, TrashIcon, CubeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Category } from '../types';

const Categories = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    category: Category | null; 
    product: any | null;
    type: 'category' | 'product' | null;
  }>({
    isOpen: false,
    category: null,
    product: null,
    type: null,
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

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list(),
  });

  const { data: selectedCategory } = useQuery({
    queryKey: ['category', selectedCategoryId],
    queryFn: () => categoriesAPI.getById(selectedCategoryId),
    enabled: !!selectedCategoryId,
  });


  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', selectedCategoryId] });
      setDeleteModal({ isOpen: false, category: null, product: null, type: null });
      if (selectedCategoryId === deleteModal.category?.id) {
        setSelectedCategoryId('');
      }
      handleSuccess('Category deleted successfully');
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to delete category');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', selectedCategoryId] });
      setDeleteModal({ isOpen: false, category: null, product: null, type: null });
      handleSuccess('Product deleted successfully');
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to delete product');
    },
  });

  const handleEditCategory = (category: any) => {
    navigate(`/admin/categories/${category.id}/edit`);
  };

  const handleDeleteCategory = (category: any) => {
    setDeleteModal({ isOpen: true, category, product: null, type: 'category' });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.type === 'category' && deleteModal.category) {
      deleteCategoryMutation.mutate(deleteModal.category.id);
    } else if (deleteModal.type === 'product' && deleteModal.product) {
      deleteProductMutation.mutate(deleteModal.product.id);
    }
  };

  const handleAddChild = (parentId: string) => {
    navigate(`/admin/categories/new?parentId=${parentId}`);
  };

  // Navigate to full product edit page (kept for comprehensive editing)
  const handleEditProduct = (product: any) => {
    navigate(`/admin/products/${product.id}/edit`);
  };

  const handleDeleteProduct = (product: any) => {
    setDeleteModal({ isOpen: true, category: null, product, type: 'product' });
  };

  // Inline editing functions
  const handleStartEdit = (product: any) => {
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
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', selectedCategoryId] });
      setEditingProduct(null);
      handleSuccess('Product updated successfully');
    } catch (error) {
      handleApiError(error, 'Failed to update product');
    }
  };

  const handleEditValueChange = (field: string, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleProductClick = (product: any) => {
    if (editingProduct !== product.id) {
      handleEditProduct(product);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FolderIcon className="h-8 w-8 mr-3 text-blue-600" />
            Categories
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {categoriesData?.pagination.total || 0} categories in your store
          </p>
        </div>
        <Link to="/admin/categories/new" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Category
        </Link>
      </div>

      {/* Breadcrumb */}
      <CategoryBreadcrumb
        categories={categoriesData?.categories || []}
        currentCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree View */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
            </div>
            <CategoryTree
              categories={categoriesData?.categories || []}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              onAddChild={handleAddChild}
              onSelect={setSelectedCategoryId}
              selectedCategoryId={selectedCategoryId}
            />
          </div>
        </div>

        {/* Details View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {selectedCategoryId && selectedCategory ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                  Category Details
                </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddChild(selectedCategory.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Child
                    </button>
                    <button
                      onClick={() => handleEditCategory(selectedCategory)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(selectedCategory)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1 text-sm text-gray-900">{selectedCategory.name}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                    <div className="mt-1 text-sm text-gray-500 font-mono">{selectedCategory.slug}</div>
                  </div>

                  {selectedCategory.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <div className="mt-1 text-sm text-gray-900">{selectedCategory.description}</div>
                    </div>
                  )}

                  {selectedCategory.parent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                      <div className="mt-1 text-sm text-gray-900">{selectedCategory.parent.name}</div>
                    </div>
                  )}


                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedCategory.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedCategory.isActive ? 'ACTIVE' : 'DRAFT'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <div className="mt-1 text-sm text-gray-500">
                      {new Date(selectedCategory.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Products section with link */}
                {selectedCategory.allProducts && selectedCategory.allProducts.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {selectedCategory.allProducts.length} products in this category and all subcategories
                      </span>
                      <Link
                        to={`/admin/products?categoryId=${selectedCategory.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View all products →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Products Table */}
                {selectedCategory.allProducts && selectedCategory.allProducts.length > 0 && (
                  <div className="mt-8">
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
                            {selectedCategory.allProducts.slice(0, 10).map((product) => (
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
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Category
                </h3>
                <p className="text-gray-500">
                  Choose a category from the tree to view details and manage it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, category: null, product: null, type: null })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'category' ? 'Delete Category' : 'Delete Product'}
        message={
          deleteModal.type === 'category' && deleteModal.category
            ? `Are you sure you want to delete "${deleteModal.category.name}"? This action cannot be undone.`
            : deleteModal.type === 'product' && deleteModal.product
            ? `Are you sure you want to delete "${deleteModal.product.title}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteModal.type === 'category' ? deleteCategoryMutation.isPending : deleteProductMutation.isPending}
        type="danger"
      />
    </div>
  );
};

export default Categories;