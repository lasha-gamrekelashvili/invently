import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboardPath } from '../hooks/useDashboardPath';
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
  const { path } = useDashboardPath();
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
    navigate(path(`categories/${category.id}/edit`));
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
    navigate(`${path('categories/new')}?parentId=${parentId}`);
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
          href: path('categories/new')
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
          <div className="bg-white rounded-2xl border border-neutral-200 p-4">
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
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            {selectedCategoryId && selectedCategory ? (
              <div>
                {/* Header with actions */}
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-light text-neutral-900 truncate tracking-tight">
                        {selectedCategory.name}
                      </h2>
                      <p className="text-sm text-neutral-500 font-mono mt-1">
                        {selectedCategory.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEditCategory(selectedCategory)}
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(selectedCategory)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Action buttons - responsive */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
                    >
                      <CubeIcon className="h-4 w-4 mr-2" />
                      <T tKey="categories.addProduct" />
                    </button>
                    <button
                      onClick={() => handleAddChild(selectedCategory.id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-neutral-300 text-sm font-medium rounded-full text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      <T tKey="categories.addChild" />
                    </button>
                  </div>
                </div>

                {/* Category info - more subtle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6 border-b border-neutral-200">
                  {selectedCategory.description && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-neutral-500">{selectedCategory.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedCategory.isActive 
                        ? 'bg-neutral-100 text-neutral-900' 
                        : 'bg-neutral-50 text-neutral-600'
                    }`}>
                      <T tKey={`categories.status.${selectedCategory.isActive ? 'active' : 'draft'}`} />
                    </span>
                    {selectedCategory.parent && (
                      <span className="text-xs text-neutral-500">
                        in <span className="font-medium text-neutral-700">{selectedCategory.parent.name}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500 sm:text-right">
                    <T tKey="common.created" />: {new Date(selectedCategory.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Products section */}
                {selectedCategory.allProducts && selectedCategory.allProducts.length > 0 ? (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-neutral-700">
                        <T tKey="categories.products.countInCategory" params={{ count: selectedCategory.allProducts.length }} />
                      </h3>
                      <Link
                        to={`${path('products')}?categoryId=${selectedCategory.id}`}
                        className="text-sm text-neutral-900 hover:text-neutral-700 font-medium transition-colors"
                      >
                        <T tKey="categories.products.viewAllProducts" />
                      </Link>
                    </div>
                    <ProductsList
                      products={selectedCategory.allProducts.slice(0, 10)}
                      emptyState={{
                        title: t('categories.products.noProductsInCategory'),
                        description: t('categories.products.noProductsInCategoryDescription')
                      }}
                      invalidateQueries={[['categories'], ['category', selectedCategoryId]]}
                    />
                  </div>
                ) : (
                  <div className="mt-6 text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                    <CubeIcon className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500 mb-3">
                      <T tKey="categories.products.noProductsInCategory" />
                    </p>
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="text-sm text-neutral-900 hover:text-neutral-700 font-medium"
                    >
                      <T tKey="categories.addProduct" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-light text-neutral-900 mb-2">
                  <T tKey="categories.emptyState.selectCategory" />
                </h3>
                <p className="text-neutral-500">
                  <T tKey="categories.emptyState.selectCategoryDescription" />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && selectedCategory && (
        <div className="fixed inset-0 bg-neutral-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-light text-neutral-900 mb-4 tracking-tight">
              <T tKey="categories.modals.addProduct.title" params={{ categoryName: selectedCategory.name }} />
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  navigate(`${path('products/new')}?categoryId=${selectedCategory.id}`);
                }}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-full text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                <T tKey="categories.modals.addProduct.createNewProduct" />
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500"><T tKey="categories.modals.addProduct.or" /></span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                className="w-full flex items-center justify-center px-4 py-3 border border-neutral-300 text-sm font-medium rounded-full text-neutral-700 bg-white hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
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