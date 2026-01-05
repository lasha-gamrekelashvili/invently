import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import { getProductPriceRange, getProductTotalStock, formatPriceRange, hasActiveVariants, getVariantSummary } from '../utils/productUtils';
import DataTable, { Column } from './DataTable';
import ConfirmationModal from './ConfirmationModal';
import StatusBadge from './StatusBadge';
import ActionButtonGroup from './ActionButtonGroup';
import { T } from '../components/Translation';
import { CubeIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import type { Product } from '../types';

interface ProductsListProps {
  products: Product[];
  isLoading?: boolean;
  emptyState?: {
    title: string;
    description: string;
    actionButton?: {
      label: string;
      onClick: () => void;
    };
  };
  onRowClick?: (product: Product) => void;
  invalidateQueries?: string[][]; // Additional queries to invalidate on update/delete
}

const ProductsList = ({
  products,
  isLoading = false,
  emptyState,
  onRowClick,
  invalidateQueries = []
}: ProductsListProps) => {
  const { t } = useLanguage();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalidate additional queries if provided
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      setDeleteModal({ isOpen: false, product: null });
      handleSuccess(t('products.deleteSuccess'));
    },
    onError: (error: any) => {
      handleApiError(error, t('products.deleteError'));
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

  const handleProductClick = (product: Product) => {
    if (onRowClick) {
      onRowClick(product);
    } else {
      handleEditProduct(product);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: t('products.columns.name'),
      render: (product) => (
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
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                {product.title}
              </div>
              {hasActiveVariants(product) && (
                <div className="ml-2 flex items-center text-xs text-blue-600">
                  <Squares2X2Icon className="h-3 w-3 mr-1" />
                  {t('products.variants.label')}
                </div>
              )}
            </div>
            {product.description && (
              <div className="text-sm text-gray-500 truncate max-w-md">{product.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'price',
      header: t('common.price'),
      render: (product) => {
        const priceRange = getProductPriceRange(product);
        const hasVariants = hasActiveVariants(product);
        
        if (hasVariants) {
          return (
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-900">
                {formatPriceRange(priceRange)}
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <Squares2X2Icon className="h-3 w-3 mr-1" />
                {getVariantSummary(product, t)}
              </div>
            </div>
          );
        }
        
        return (
          <span className="text-sm text-gray-900">
            ${product.price.toFixed(2)}
          </span>
        );
      }
    },
    {
      key: 'stockQuantity',
      header: t('products.columns.stock'),
      render: (product) => {
        const stockInfo = getProductTotalStock(product);
        const hasVariants = hasActiveVariants(product);
        
        if (hasVariants) {
          return (
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-900">
                {stockInfo.total} <T tKey="common.total" />
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <Squares2X2Icon className="h-3 w-3 mr-1" />
                {getVariantSummary(product, t)}
              </div>
            </div>
          );
        }
        
        return (
          <span className="text-sm text-gray-900">
            {product.stockQuantity}
          </span>
        );
      }
    },
    {
      key: 'category',
      header: t('products.columns.category'),
      render: (product) => (
        product.category ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {product.category.name}
          </span>
        ) : (
          <span className="text-sm text-gray-400"><T tKey="products.noCategory" /></span>
        )
      )
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (product) => (
        <StatusBadge status={product.status} type="product" />
      )
    },
    {
      key: 'actions',
      header: t('common.actions'),
      headerClassName: 'text-right',
      className: 'text-right',
      render: (product) => (
        <ActionButtonGroup
          actions={[
            {
              type: 'delete',
              onClick: () => handleDeleteProduct(product),
              title: t('common.delete')
            }
          ]}
        />
      )
    }
  ];

  return (
    <>
      <DataTable
        data={products}
        columns={columns}
        isLoading={isLoading}
        emptyState={emptyState ? {
          ...emptyState,
          icon: CubeIcon
        } : undefined}
        onRowClick={handleProductClick}
        getRowClassName={() => 'cursor-pointer'}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={handleConfirmDelete}
        title={t('products.deleteConfirm.title')}
        message={
          deleteModal.product
            ? t('products.deleteConfirm.message', { title: deleteModal.product.title })
            : ''
        }
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        type="danger"
      />
    </>
  );
};

export default ProductsList;
