import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, debounce } from '../utils/api';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import DatePicker from '../components/DatePicker';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import type { Order } from '../types';

const Orders = () => {
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
      placeholder: 'Search orders...',
      value: searchInput,
      onChange: (value: string) => {
        setSearchInput(value);
        debouncedSetSearchQuery(value);
      }
    },
    {
      type: 'dropdown' as const,
      key: 'status',
      placeholder: 'All Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: '', label: 'All Status' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'SHIPPED', label: 'Shipped' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' },
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
              placeholder="From"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="To"
            />
          </div>
        </div>
      )
    }
  ];

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (order) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {order.orderNumber}
          </div>
          <div className="text-sm text-gray-500">
            {order.items.length} items
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {order.customerName}
          </div>
          <div className="text-sm text-gray-500">
            {order.customerEmail}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => (
        <StatusBadge status={order.status} type="order" showIcon={true} />
      )
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (order) => (
        <span className="text-sm text-gray-900">
          ${order.totalAmount.toFixed(2)}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (order) => (
        <span className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  const hasActiveFilters = !!(statusFilter || searchQuery || startDate || endDate);

  const handleOrderClick = (order: Order) => {
    navigate(`/admin/orders/${order.id}`);
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Manage and track your store orders"
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
            title: 'No orders found',
            description: hasActiveFilters
              ? 'Try adjusting your filters.'
              : 'Orders will appear here once customers start buying from your store.',
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