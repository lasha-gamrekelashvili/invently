import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { getProductPriceRange, getProductTotalStock, formatPriceRange, hasActiveVariants, getVariantSummary } from '../utils/productUtils';
import DataTable, { Column } from './DataTable';
import ConfirmationModal from './ConfirmationModal';
import StatusBadge from './StatusBadge';
import ActionButtonGroup from './ActionButtonGroup';
import InlineEditField from './InlineEditField';
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalidate additional queries if provided
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
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
    // Don't allow inline editing for products with variants
    if (hasActiveVariants(product)) {
      return;
    }
    
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
      // Invalidate additional queries if provided
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
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
      if (onRowClick) {
        onRowClick(product);
      } else {
        // For products with variants, always go to edit page
        // For products without variants, allow inline editing
        if (hasActiveVariants(product)) {
          handleEditProduct(product);
        } else {
          handleEditProduct(product);
        }
      }
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
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
                  Variants
                </div>
              )}
            </div>
            {product.description && (
              <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'price',
      header: 'Price',
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
                {getVariantSummary(product)}
              </div>
            </div>
          );
        }
        
        return (
          <InlineEditField
            type="number"
            value={editingProduct === product.id ? editValues.price : product.price.toString()}
            onChange={(value) => handleEditValueChange('price', value)}
            isEditing={editingProduct === product.id}
            displayValue={`$${product.price}`}
            step="0.01"
            min="0"
          />
        );
      }
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      render: (product) => {
        const stockInfo = getProductTotalStock(product);
        const hasVariants = hasActiveVariants(product);
        
        if (hasVariants) {
          return (
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-900">
                {stockInfo.total} total
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <Squares2X2Icon className="h-3 w-3 mr-1" />
                {getVariantSummary(product)}
              </div>
            </div>
          );
        }
        
        return (
          <InlineEditField
            type="number"
            value={editingProduct === product.id ? editValues.stockQuantity : product.stockQuantity.toString()}
            onChange={(value) => handleEditValueChange('stockQuantity', value)}
            isEditing={editingProduct === product.id}
            displayValue={product.stockQuantity.toString()}
            min="0"
          />
        );
      }
    },
    {
      key: 'category',
      header: 'Category',
      render: (product) => (
        product.category ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {product.category.name}
          </span>
        ) : (
          <span className="text-sm text-gray-400">No category</span>
        )
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => (
        editingProduct === product.id ? (
          <InlineEditField
            type="dropdown"
            value={editValues.status}
            onChange={(value) => handleEditValueChange('status', value)}
            isEditing={true}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'DRAFT', label: 'DRAFT' },
            ]}
          />
        ) : (
          <StatusBadge status={product.status} type="product" />
        )
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (product) => {
        const hasVariants = hasActiveVariants(product);
        
        if (editingProduct === product.id) {
          // Only allow editing base product fields if no variants
          if (hasVariants) {
            return (
              <ActionButtonGroup
                actions={[
                  { type: 'cancel', onClick: handleCancelEdit }
                ]}
              />
            );
          }
          
          return (
            <ActionButtonGroup
              actions={[
                { type: 'save', onClick: handleSaveEdit },
                { type: 'cancel', onClick: handleCancelEdit }
              ]}
            />
          );
        }
        
        return (
          <ActionButtonGroup
            actions={[
              {
                type: 'edit',
                onClick: () => handleStartEdit(product),
                title: hasVariants ? 'Edit product (variants managed separately)' : 'Edit product inline',
                disabled: hasVariants
              },
              {
                type: 'delete',
                onClick: () => handleDeleteProduct(product),
                title: 'Delete product'
              }
            ]}
          />
        );
      }
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
        getRowClassName={(product) => editingProduct !== product.id ? 'cursor-pointer' : ''}
      />

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
    </>
  );
};

export default ProductsList;
