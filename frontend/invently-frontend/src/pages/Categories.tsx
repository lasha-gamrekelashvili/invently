import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI, productsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryTree from '../components/CategoryTree';
import CategoryBreadcrumb from '../components/CategoryBreadcrumb';
import ConfirmationModal from '../components/ConfirmationModal';
import PageHeader from '../components/PageHeader';
import ProductsList from '../components/ProductsList';
import CustomDropdown from '../components/CustomDropdown';
import { T } from '../components/Translation';
import { PlusIcon, FolderIcon, PencilIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import type { Category } from '../types';

const Categories = () => {
  const { t } = useLanguage();
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

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list({ limit: 1000 }), // Fetch all categories for tree view
  });

  const { data: selectedCategory } = useQuery({
    queryKey: ['category', selectedCategoryId],
    queryFn: () => categoriesAPI.getById(selectedCategoryId),
    enabled: !!selectedCategoryId,
  });

  const { data: allProductsData } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => productsAPI.list({ limit: 1000 }),
    enabled: showAddProductModal,
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
      handleSuccess(t('categories.deleteSuccess'));
    },
    onError: (error: any) => {
      handleApiError(error, t('categories.deleteError'));
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', selectedCategoryId] });
      setDeleteModal({ isOpen: false, category: null, product: null, type: null });
      handleSuccess(t('products.deleteSuccess'));
    },
    onError: (error: any) => {
      handleApiError(error, t('products.deleteError'));
    },
  });

  const assignProductMutation = useMutation({
    mutationFn: ({ productId, categoryId }: { productId: string; categoryId: string }) =>
      productsAPI.update(productId, { categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', selectedCategoryId] });
      setShowAddProductModal(false);
      setSelectedProductId('');
      handleSuccess(t('categories.addProductSuccess'));
    },
    onError: (error: any) => {
      handleApiError(error, t('categories.addProductError'));
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


  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('navigation.categories')}
        subtitle={t('categories.subtitle', { count: categoriesData?.pagination.total || 0 })}
        icon={FolderIcon}
        actionButton={{
          label: t('categories.addCategory'),
          href: '/admin/categories/new'
        }}
      />

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
                  <T tKey="categories.details" />
                </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <CubeIcon className="h-4 w-4 mr-2" />
                      <T tKey="categories.addProduct" />
                    </button>
                    <button
                      onClick={() => handleAddChild(selectedCategory.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      <T tKey="categories.addChild" />
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
                    <label className="block text-sm font-medium text-gray-700"><T tKey="common.name" /></label>
                    <div className="mt-1 text-sm text-gray-900">{selectedCategory.name}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700"><T tKey="categories.form.slug" /></label>
                    <div className="mt-1 text-sm text-gray-500 font-mono">{selectedCategory.slug}</div>
                  </div>

                  {selectedCategory.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700"><T tKey="common.description" /></label>
                      <div className="mt-1 text-sm text-gray-900">{selectedCategory.description}</div>
                    </div>
                  )}

                  {selectedCategory.parent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700"><T tKey="categories.form.parentCategory" /></label>
                      <div className="mt-1 text-sm text-gray-900">{selectedCategory.parent.name}</div>
                    </div>
                  )}


                  <div>
                    <label className="block text-sm font-medium text-gray-700"><T tKey="common.status" /></label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedCategory.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <T tKey={`categories.status.${selectedCategory.isActive ? 'active' : 'draft'}`} />
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700"><T tKey="common.created" /></label>
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
                        <T tKey="categories.products.countInCategory" params={{ count: selectedCategory.allProducts.length }} />
                      </span>
                      <Link
                        to={`/admin/products?categoryId=${selectedCategory.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <T tKey="categories.products.viewAllProducts" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Products Table */}
                {selectedCategory.allProducts && selectedCategory.allProducts.length > 0 && (
                  <div className="mt-8">
                    <ProductsList
                      products={selectedCategory.allProducts.slice(0, 10)}
                      emptyState={{
                        title: t('categories.products.noProductsInCategory'),
                        description: t('categories.products.noProductsInCategoryDescription')
                      }}
                      invalidateQueries={[['categories'], ['category', selectedCategoryId]]}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  <T tKey="categories.emptyState.selectCategory" />
                </h3>
                <p className="text-gray-500">
                  <T tKey="categories.emptyState.selectCategoryDescription" />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <T tKey="categories.modals.addProduct.title" params={{ categoryName: selectedCategory.name }} />
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  navigate(`/admin/products/new?categoryId=${selectedCategory.id}`);
                }}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                <T tKey="categories.modals.addProduct.createNewProduct" />
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500"><T tKey="categories.modals.addProduct.or" /></span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <T tKey="categories.modals.addProduct.selectExistingProduct" />
                </label>
                <CustomDropdown
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  options={[
                    { value: '', label: t('categories.modals.addProduct.chooseProduct') },
                    ...(allProductsData?.products || []).map((product: any) => ({
                      value: product.id,
                      label: `${product.title} ${product.category?.name ? `(${product.category.name})` : ''}`,
                    }))
                  ]}
                  placeholder={t('categories.modals.addProduct.chooseProduct')}
                />
              </div>

              <button
                onClick={() => {
                  if (selectedProductId) {
                    assignProductMutation.mutate({
                      productId: selectedProductId,
                      categoryId: selectedCategory.id
                    });
                  }
                }}
                disabled={!selectedProductId || assignProductMutation.isPending}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CubeIcon className="w-5 h-5 mr-2" />
                {assignProductMutation.isPending ? t('categories.modals.addProduct.adding') : t('categories.modals.addProduct.addSelectedProduct')}
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setSelectedProductId('');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <T tKey="categories.modals.addProduct.cancel" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, category: null, product: null, type: null })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'category' ? t('categories.modals.deleteConfirm.deleteCategory') : t('categories.modals.deleteConfirm.deleteProduct')}
        message={
          deleteModal.type === 'category' && deleteModal.category
            ? t('categories.modals.deleteConfirm.deleteCategoryMessage', { categoryName: deleteModal.category.name })
            : deleteModal.type === 'product' && deleteModal.product
            ? t('categories.modals.deleteConfirm.deleteProductMessage', { productName: deleteModal.product.title })
            : ''
        }
        confirmText={t('categories.modals.deleteConfirm.delete')}
        cancelText={t('categories.modals.deleteConfirm.cancel')}
        isLoading={deleteModal.type === 'category' ? deleteCategoryMutation.isPending : deleteProductMutation.isPending}
        type="danger"
      />
    </div>
  );
};

export default Categories;