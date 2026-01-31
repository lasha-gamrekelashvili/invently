import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyStateCard from './EmptyStateCard';

export interface Column<T = any> {
  key: string;
  header: string;
  render?: (item: T, value: any) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
    actionButton?: {
      label: string;
      onClick: () => void;
    };
  };
  onRowClick?: (item: T) => void;
  className?: string;
  getRowClassName?: (item: T, index: number) => string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyState,
  onRowClick,
  className = '',
  getRowClassName
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200">
        <div className="p-8 text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!data.length && emptyState) {
    return (
      <EmptyStateCard
        title={emptyState.title}
        description={emptyState.description}
        icon={emptyState.icon}
        actionButton={emptyState.actionButton}
      />
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-neutral-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider ${
                    column.headerClassName || ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                className={`hover:bg-neutral-50 ${onRowClick ? 'cursor-pointer' : ''} ${
                  getRowClassName ? getRowClassName(item, index) : ''
                }`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(item, item[column.key])
                      : item[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;