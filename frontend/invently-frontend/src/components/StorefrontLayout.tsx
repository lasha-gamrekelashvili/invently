import React, { useState } from 'react';
import {
  CubeIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import CategoryTree from './CategoryTree';
import StorefrontHeader from './StorefrontHeader';
import StorefrontFooter from './StorefrontFooter';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  storeInfo?: {
    name: string;
    description?: string;
  };
  storeSettings?: any;
  categories?: any[];
  selectedCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
  onAllProductsClick?: () => void;
  onCartClick: () => void;
  onSearchChange?: (query: string) => void;
  onPriceRangeChange?: (min: string, max: string) => void;
  priceRange?: { min: string; max: string };
  gridLayout?: number;
  onGridLayoutChange?: (layout: number) => void;
}

const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
  children,
  storeInfo,
  storeSettings,
  categories = [],
  selectedCategoryId,
  onCategorySelect,
  onAllProductsClick,
  onCartClick,
  onSearchChange,
  onPriceRangeChange,
  priceRange: externalPriceRange,
  gridLayout = 3,
  onGridLayoutChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePriceChange = (field: 'min' | 'max', value: string) => {
    // Call the parent callback immediately to update local state (no lag)
    if (onPriceRangeChange) {
      const newMin = field === 'min' ? value : (externalPriceRange?.min || '');
      const newMax = field === 'max' ? value : (externalPriceRange?.max || '');
      onPriceRangeChange(newMin, newMax);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <StorefrontHeader
        storeInfo={storeInfo}
        onMenuClick={() => setSidebarOpen(true)}
        onCartClick={onCartClick}
        onSearchChange={onSearchChange}
        gridLayout={gridLayout}
        onGridLayoutChange={onGridLayoutChange}
      />

      <div className="flex-1 flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Sidebar - Filters */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* All Products Button */}
            <button
              onClick={onAllProductsClick}
              className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                !selectedCategoryId
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <CubeIcon className="w-5 h-5 mr-2.5" />
              All Products
            </button>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-medium text-gray-400 mb-2 px-1">
                Categories
              </h3>
              {categories && categories.length > 0 ? (
                <CategoryTree
                  categories={categories}
                  onSelect={onCategorySelect}
                  selectedCategoryId={selectedCategoryId}
                  showProductCounts={true}
                  compact={true}
                />
              ) : (
                <p className="text-sm text-gray-500 px-1">
                  {categories === undefined ? 'Loading...' : 'No categories'}
                </p>
              )}
            </div>


            {/* Price Filter */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-400 mb-3 px-1">
                Price Range
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={externalPriceRange?.min || ''}
                    onChange={(e) => handlePriceChange('min', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
                <span className="text-gray-400 text-sm">-</span>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Max"
                    value={externalPriceRange?.max || ''}
                    onChange={(e) => handlePriceChange('max', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar - Filter Drawer */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <FunnelIcon className="w-5 h-5 mr-2 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* All Products Button */}
              <button
                onClick={() => {
                  onAllProductsClick?.();
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  !selectedCategoryId
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <CubeIcon className="w-5 h-5 mr-2.5" />
                All Products
              </button>

              {/* Categories */}
              <div>
                <h3 className="text-xs font-medium text-gray-400 mb-2 px-1">
                  Categories
                </h3>
                {categories && categories.length > 0 ? (
                  <CategoryTree
                    categories={categories}
                    onSelect={(id) => {
                      onCategorySelect?.(id);
                      setSidebarOpen(false);
                    }}
                    selectedCategoryId={selectedCategoryId}
                    showProductCounts={true}
                    compact={true}
                  />
                ) : (
                  <p className="text-sm text-gray-500 px-1">
                    {categories === undefined ? 'Loading...' : 'No categories'}
                  </p>
                )}
              </div>


              {/* Price Filter */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-medium text-gray-400 mb-3 px-1">
                  Price Range
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={externalPriceRange?.min || ''}
                      onChange={(e) => handlePriceChange('min', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                  <span className="text-gray-400 text-sm">-</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max"
                      value={externalPriceRange?.max || ''}
                      onChange={(e) => handlePriceChange('max', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Apply Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <StorefrontFooter settings={storeSettings} />
    </div>
  );
};

export default StorefrontLayout;
