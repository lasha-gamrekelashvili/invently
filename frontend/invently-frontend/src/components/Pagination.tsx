import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  className = ''
}) => {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  return (
    <div className={`bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-200 sm:px-6 ${className}`}>
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.previous')}
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.next')}
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        {showInfo && (
          <div>
            <p className="text-sm text-neutral-500">
{t('common.showingPage')} <span className="font-medium text-neutral-900">{currentPage}</span> {t('common.of')}{' '}
              <span className="font-medium text-neutral-900">{totalPages}</span>
            </p>
          </div>
        )}
        <div>
          <nav className="relative z-0 inline-flex rounded-md -space-x-px">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;