import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDashboardPath } from '../hooks/useDashboardPath';
import { ordersAPI, debounce } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import DatePicker from '../components/DatePicker';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import type { Order } from '../types';

const Orders = () => {
  const { t } = useLanguage();
  const { path } = useDashboardPath();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const debouncedSetSearchQuery = useMemo(
    () => debounce(setSearchQuery, 300),
    []
  );

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', currentPage, statusFilter, searchQuery, startDate, endDate],
    queryFn: () => ordersAPI.getOrders({
      page: currentPage,
      limit: 10,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  });


  const filterFields = [
    {
      type: 'search' as const,
      key: 'search',
      placeholder: t('orders.searchPlaceholder'),
      value: searchInput,
      onChange: (value: string) => {
        setSearchInput(value);
        debouncedSetSearchQuery(value);
      }
    },
    {
      type: 'dropdown' as const,
      key: 'status',
      placeholder: t('orders.allStatuses'),
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: '', label: t('orders.allStatuses') },
        { value: 'PENDING', label: t('orders.status.pending') },
        { value: 'CONFIRMED', label: t('orders.status.confirmed') },
        { value: 'SHIPPED', label: t('orders.status.shipped') },
        { value: 'DELIVERED', label: t('orders.status.delivered') },
        { value: 'CANCELLED', label: t('orders.status.cancelled') },
      ]
    },
    {
      type: 'custom' as const,
      key: 'dateRange',
      children: (
        <div className="flex gap-2">
          <div className="flex-1">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder={t('common.from')}
            />
          </div>
          <div className="flex-1">
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder={t('common.to')}
            />
          </div>
        </div>
      )
    }
  ];

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: t('orders.columns.orderNumber'),
      render: (order) => (
        <div>
          <div className="text-sm font-medium text-neutral-900">
            {order.orderNumber}
          </div>
          <div className="text-sm text-neutral-500">
            {order.items.length} {t('common.items')}
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: t('orders.columns.customer'),
      render: (order) => (
        <div>
          <div className="text-sm font-medium text-neutral-900">
            {order.customerName}
          </div>
          <div className="text-sm text-neutral-500">
            {order.customerEmail}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (order) => (
        <StatusBadge status={order.status} type="order" showIcon={true} />
      )
    },
    {
      key: 'totalAmount',
      header: t('common.total'),
      render: (order) => (
        <span className="text-sm text-neutral-900">
          ${order.totalAmount.toFixed(2)}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: t('common.date'),
      render: (order) => (
        <span className="text-sm text-neutral-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  const hasActiveFilters = !!(statusFilter || searchQuery || startDate || endDate);

  const handleOrderClick = (order: Order) => {
    navigate(path(`orders/${order.id}`));
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title={t('navigation.orders')}
        subtitle={t('orders.subtitle')}
        icon={ShoppingBagIcon}
      />

      <FilterSection
        fields={filterFields}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setSearchQuery('');
          setSearchInput('');
          setStatusFilter('');
          setStartDate('');
          setEndDate('');
        }}
      />

      <div>
        <DataTable
          data={ordersData?.data || []}
          columns={columns}
          isLoading={isLoading}
          emptyState={{
            title: t('orders.noOrders'),
            description: hasActiveFilters
              ? t('orders.noOrdersFiltered')
              : t('orders.noOrdersDescription'),
            icon: ShoppingBagIcon
          }}
          onRowClick={handleOrderClick}
          getRowClassName={() => "cursor-pointer transition-colors"}
        />

        {ordersData?.pagination && ordersData.pagination.pages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={ordersData.pagination.pages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

    </div>
  );
};

export default Orders;