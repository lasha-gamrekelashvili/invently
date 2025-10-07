import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, debounce } from '../utils/api';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import ProductsList from '../components/ProductsList';
import { CubeIcon } from '@heroicons/react/24/outline';

const Products = () => {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

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

      <ProductsList
        products={productsData?.products || []}
        isLoading={isLoading}
        emptyState={{
          title: hasActiveFilters ? 'No products found' : 'No products yet',
          description: hasActiveFilters
            ? 'Try adjusting your search criteria or filters.'
            : 'Get started by creating your first product.',
          ...(hasActiveFilters && {
            actionButton: {
              label: 'Clear filters',
              onClick: clearFilters
            }
          })
        }}
      />
    </div>
  );
};

export default Products;