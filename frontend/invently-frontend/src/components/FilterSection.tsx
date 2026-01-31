import React from 'react';
import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import CustomDropdown from './CustomDropdown';
import PriceRangeSlider from './PriceRangeSlider';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  type: 'search' | 'dropdown' | 'price-range' | 'custom';
  key: string;
  placeholder?: string;
  options?: FilterOption[];
  value?: string | { min: string; max: string };
  onChange?: (value: any) => void;
  className?: string;
  children?: React.ReactNode;
  minPrice?: number;
  maxPrice?: number;
}

interface FilterSectionProps {
  fields: FilterField[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  fields,
  hasActiveFilters = false,
  onClearFilters,
  className = ''
}) => {
  const { t } = useLanguage();
  const renderField = (field: FilterField) => {
    switch (field.type) {
      case 'search':
        return (
          <div className={field.className || ''}>
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={field.placeholder || t('common.search')}
                value={field.value as string || ''}
                onChange={(e) => field.onChange?.(e.target.value)}
                className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-neutral-300 rounded-xl text-xs sm:text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div className={field.className || ''}>
            <CustomDropdown
              value={field.value as string || ''}
              onChange={field.onChange || (() => {})}
              options={field.options || []}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'price-range':
        const priceValue = field.value as { min: string; max: string } || { min: '', max: '' };
        return (
          <div className={field.className || ''}>
            <PriceRangeSlider
              value={priceValue}
              onChange={(min, max) => field.onChange?.({ min, max })}
              minPrice={field.minPrice ?? 0}
              maxPrice={field.maxPrice ?? 1000}
            />
          </div>
        );

      case 'custom':
        return (
          <div className={field.className || ''}>
            {field.children}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white p-6 rounded-2xl border border-neutral-200 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {fields.map((field, index) => (
          <div key={field.key || index}>
            {renderField(field)}
          </div>
        ))}
      </div>

      {hasActiveFilters && onClearFilters && (
        <div className="flex justify-end mt-3 pt-3 border-t border-neutral-200">
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <XCircleIcon className="h-4 w-4" />
            {t('common.clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterSection;