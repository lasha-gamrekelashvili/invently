import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, debounce } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import DataTable, { Column } from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import StatusBadge from '../components/StatusBadge';
import ActionButtonGroup from '../components/ActionButtonGroup';
import InlineEditField from '../components/InlineEditField';
import { CubeIcon } from '@heroicons/react/24/outline';
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

  const hasActiveFilters = !!(searchQuery || statusFilter || categoryFilter || minPrice || maxPrice);

  const filterFields = [
    {
      type: 'search' as const,
      key: 'search',
      placeholder: 'Search products...',
      className: 'lg:col-span-2',
      value: searchInput,
      onChange: (value: string) => {
        setSearchInput(value);
        debouncedSetSearchQuery(value);
      }
    },
    {
      type: 'dropdown' as const,
      key: 'status',
      placeholder: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: '', label: 'All Status' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'DRAFT', label: 'Draft' },
      ]
    },
    {
      type: 'dropdown' as const,
      key: 'category',
      placeholder: 'Category',
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: [
        { value: '', label: 'All Categories' },
        ...(categoriesData?.categories?.map(cat => ({
          value: cat.id,
          label: cat.name
        })) || [])
      ]
    },
    {
      type: 'price-range' as const,
      key: 'price',
      value: { min: minPrice, max: maxPrice },
      onChange: (value: { min: string; max: string }) => {
        setMinPrice(value.min);
        setMaxPrice(value.max);
      }
    }
  ];

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
            <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
              {product.title}
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
      render: (product) => (
        <InlineEditField
          type="number"
          value={editingProduct === product.id ? editValues.price : product.price.toString()}
          onChange={(value) => handleEditValueChange('price', value)}
          isEditing={editingProduct === product.id}
          displayValue={`$${product.price}`}
          step="0.01"
          min="0"
        />
      )
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      render: (product) => (
        <InlineEditField
          type="number"
          value={editingProduct === product.id ? editValues.stockQuantity : product.stockQuantity.toString()}
          onChange={(value) => handleEditValueChange('stockQuantity', value)}
          isEditing={editingProduct === product.id}
          displayValue={product.stockQuantity.toString()}
          min="0"
        />
      )
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
      render: (product) => (
        editingProduct === product.id ? (
          <ActionButtonGroup
            actions={[
              { type: 'save', onClick: handleSaveEdit },
              { type: 'cancel', onClick: handleCancelEdit }
            ]}
          />
        ) : (
          <ActionButtonGroup
            actions={[
              {
                type: 'edit',
                onClick: () => handleStartEdit(product),
                title: 'Edit product inline'
              },
              {
                type: 'delete',
                onClick: () => handleDeleteProduct(product),
                title: 'Delete product'
              }
            ]}
          />
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle={`${productsData?.pagination.total || 0} products in your store`}
        icon={CubeIcon}
        actionButton={{
          label: 'Add Product',
          href: '/admin/products/new'
        }}
      />

      <FilterSection
        fields={filterFields}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <DataTable
        data={productsData?.products || []}
        columns={columns}
        isLoading={isLoading}
        emptyState={{
          title: hasActiveFilters ? 'No products found' : 'No products yet',
          description: hasActiveFilters
            ? 'Try adjusting your search criteria or filters.'
            : 'Get started by creating your first product.',
          icon: CubeIcon,
          ...(hasActiveFilters && {
            actionButton: {
              label: 'Clear filters',
              onClick: clearFilters
            }
          })
        }}
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
    </div>
  );
};

export default Products;