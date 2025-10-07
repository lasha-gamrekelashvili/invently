import React from 'react';
import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import CustomDropdown from './CustomDropdown';

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
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={field.placeholder || t('common.search')}
                value={field.value as string || ''}
                onChange={(e) => field.onChange?.(e.target.value)}
                className="input-field pl-10"
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
          <div className={`flex space-x-2 ${field.className || ''}`}>
            <input
              type="number"
              placeholder={t('common.minPrice')}
              value={priceValue.min}
              onChange={(e) => field.onChange?.({ ...priceValue, min: e.target.value })}
              className="input-field text-sm"
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder={t('common.maxPrice')}
              value={priceValue.max}
              onChange={(e) => field.onChange?.({ ...priceValue, max: e.target.value })}
              className="input-field text-sm"
              min="0"
              step="0.01"
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
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {fields.map((field, index) => (
          <div key={field.key || index}>
            {renderField(field)}
          </div>
        ))}
      </div>

      {hasActiveFilters && onClearFilters && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors duration-200"
          >
            <XCircleIcon className="h-3 w-3 mr-1" />
            {t('common.clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterSection;