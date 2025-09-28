import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryTree from '../components/CategoryTree';
import CategoryBreadcrumb from '../components/CategoryBreadcrumb';
import ConfirmationModal from '../components/ConfirmationModal';
import { PlusIcon, FolderIcon, PencilIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import type { Category } from '../types';

const Categories = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null,
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


  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteModal({ isOpen: false, category: null });
      if (selectedCategoryId === deleteModal.category?.id) {
        setSelectedCategoryId('');
      }
      handleSuccess('Category deleted successfully');
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to delete category');
    },
  });

  const handleEditCategory = (category: any) => {
    navigate(`/admin/categories/${category.id}/edit`);
  };

  const handleDeleteCategory = (category: any) => {
    setDeleteModal({ isOpen: true, category });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.category) {
      deleteMutation.mutate(deleteModal.category.id);
    }
  };

  const handleAddChild = (parentId: string) => {
    navigate(`/admin/categories/new?parentId=${parentId}`);
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
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
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(selectedCategory)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
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
                    <label className="block text-sm font-medium text-gray-700">Products</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedCategory._recursiveCount || selectedCategory._count?.products || 0} products in this category and all subcategories
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedCategory.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCategory.isActive ? 'Active' : 'Inactive'}
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

                {/* Products in this category and all subcategories */}
                {selectedCategory.allProducts && selectedCategory.allProducts.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Products in this category and all subcategories</h4>
                      <Link
                        to={`/admin/products?categoryId=${selectedCategory.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {selectedCategory.allProducts.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              {product.images?.[0] ? (
                                <img
                                  className="h-8 w-8 rounded object-cover"
                                  src={product.images[0].url}
                                  alt={product.images[0].altText || product.title}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                                  <CubeIcon className="h-4 w-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{product.title}</div>
                              <div className="text-xs text-gray-500">${product.price}</div>
                              {product.category && (
                                <div className="text-xs text-blue-600">in {product.category.name}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              product.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {product.status}
                            </span>
                            <span className="text-xs text-gray-500">{product.stockQuantity} in stock</span>
                          </div>
                        </div>
                      ))}
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
        onClose={() => setDeleteModal({ isOpen: false, category: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={
          deleteModal.category 
            ? `Are you sure you want to delete "${deleteModal.category.name}"? This action cannot be undone.`
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

export default Categories;