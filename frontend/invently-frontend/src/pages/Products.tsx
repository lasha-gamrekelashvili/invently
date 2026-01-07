import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { productsAPI, categoriesAPI, debounce } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import ProductsList from '../components/ProductsList';
import StorefrontPagination from '../components/StorefrontPagination';
import { CubeIcon } from '@heroicons/react/24/outline';

const Products = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read all filters from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || ''; // 'active', 'draft', 'deleted', or ''
  const categoryFilter = searchParams.get('categoryId') || '';
  
  // Local state for search input (debounced)
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Sync searchInput with URL on mount/change
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Debounced search update
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      updateUrlParams({ search: value, page: '1' });
    }, 300),
    []
  );

  // Helper to update URL parameters
  const updateUrlParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  };

  // Map status filter to isActive and isDeleted params
  const getStatusParams = () => {
    switch (statusFilter) {
      case 'active':
        return { isActive: true, isDeleted: false };
      case 'draft':
        return { isActive: false, isDeleted: false };
      case 'deleted':
        return { isDeleted: true };
      default:
        return {}; // All statuses - no filter
    }
  };

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', currentPage, searchQuery, statusFilter, categoryFilter],
    queryFn: () => productsAPI.list({
      page: currentPage,
      limit: 20,
      search: searchQuery || undefined,
      ...getStatusParams(),
      categoryId: categoryFilter || undefined,
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list({ limit: 1000 }),
  });

  // Flatten category tree to include all categories with full path
  const flattenCategories = (categories: any[], parentPath = ''): any[] => {
    if (!categories) return [];
    
    const flattened: any[] = [];
    categories.forEach(cat => {
      const fullPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
      flattened.push({
        id: cat.id,
        name: fullPath
      });
      if (cat.children && cat.children.length > 0) {
        flattened.push(...flattenCategories(cat.children, fullPath));
      }
    });
    return flattened;
  };

  const allCategories = flattenCategories(categoriesData?.categories || []);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
  };

  const hasActiveFilters = !!(searchQuery || statusFilter || categoryFilter);

  const filterFields = [
    {
      type: 'search' as const,
      key: 'search',
      placeholder: t('products.searchPlaceholder'),
      className: 'lg:col-span-2',
      value: searchInput,
      onChange: (value: string) => {
        setSearchInput(value);
        debouncedSetSearch(value);
      }
    },
    {
      type: 'dropdown' as const,
      key: 'status',
      placeholder: t('common.status'),
      value: statusFilter,
      onChange: (value: string) => {
        updateUrlParams({ status: value, page: '1' });
      },
      options: [
        { value: '', label: t('products.allStatuses') },
        { value: 'active', label: t('products.status.active') },
        { value: 'draft', label: t('products.status.draft') },
        { value: 'deleted', label: t('products.status.deleted') },
      ]
    },
    {
      type: 'dropdown' as const,
      key: 'category',
      placeholder: t('navigation.categories'),
      value: categoryFilter,
      onChange: (value: string) => {
        updateUrlParams({ categoryId: value, page: '1' });
      },
      options: [
        { value: '', label: t('products.allCategories') },
        ...allCategories.map(cat => ({
          value: cat.id,
          label: cat.name
        }))
      ]
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

      <div>
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

        {productsData?.pagination && productsData.pagination.pages > 1 && (
          <StorefrontPagination
            currentPage={currentPage}
            totalPages={productsData.pagination.pages}
            totalItems={productsData.pagination.total}
            itemsPerPage={productsData.pagination.limit}
            onPageChange={(page) => updateUrlParams({ page: page.toString() })}
          />
        )}
      </div>
    </div>
  );
};

export default Products;