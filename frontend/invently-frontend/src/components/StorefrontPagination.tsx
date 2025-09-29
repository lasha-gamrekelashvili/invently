import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface StorefrontPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const StorefrontPagination: React.FC<StorefrontPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the beginning
        pages.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // In the middle
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-8">
      <div className="px-6 py-4">
        {/* Desktop View */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
            <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalItems}</span> products
          </div>

          <nav className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {pageNumbers.map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page as number)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </nav>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-3">
          <div className="text-sm text-center text-gray-600">
            Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>
          <div className="flex items-center justify-between space-x-3">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorefrontPagination;