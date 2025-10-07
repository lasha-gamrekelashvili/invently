import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, debounce } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import ProductsList from '../components/ProductsList';
import { CubeIcon } from '@heroicons/react/24/outline';

const Products = () => {
  const { t } = useLanguage();
  
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
      placeholder: t('products.searchPlaceholder'),
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
      placeholder: t('common.status'),
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: '', label: t('products.allStatuses') },
        { value: 'ACTIVE', label: t('products.status.active') },
        { value: 'DRAFT', label: t('products.status.draft') },
      ]
    },
    {
      type: 'dropdown' as const,
      key: 'category',
      placeholder: t('navigation.categories'),
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: [
        { value: '', label: t('products.allCategories') },
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
        title={t('navigation.products')}
        subtitle={t('products.subtitle', { count: productsData?.pagination.total || 0 })}
        icon={CubeIcon}
        actionButton={{
          label: t('products.addProduct'),
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
          title: hasActiveFilters ? t('products.noProducts') : t('products.noProductsYet'),
          description: hasActiveFilters
            ? t('products.noProductsFiltered')
            : t('products.noProductsDescription'),
          ...(hasActiveFilters && {
            actionButton: {
              label: t('common.clear'),
              onClick: clearFilters
            }
          })
        }}
      />
    </div>
  );
};

export default Products;