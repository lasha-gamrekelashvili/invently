import React, { useState } from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import StorefrontHeader from './StorefrontHeader';
import StorefrontFooter from './StorefrontFooter';
import CategoryTree from './CategoryTree';
import PriceRangeSlider from './PriceRangeSlider';

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
  maxPrice?: number;
  gridLayout?: number;
  onGridLayoutChange?: (layout: number) => void;
  searchQuery?: string;
  isCartOpen?: boolean;
  hideSidebar?: boolean;
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
  maxPrice = 1000,
  gridLayout = 3,
  onGridLayoutChange,
  searchQuery = '',
  isCartOpen = false,
  hideSidebar = false,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent background scroll when sidebar is open
  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <StorefrontHeader
        storeInfo={storeInfo}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onCartClick={onCartClick}
        onSearchChange={onSearchChange}
        gridLayout={gridLayout}
        onGridLayoutChange={onGridLayoutChange}
        searchQuery={searchQuery}
        isCartOpen={isCartOpen}
        isSidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && !hideSidebar && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Sidebar - Only visible on large screens (1024px+) */}
        {!hideSidebar && (
          <aside className="hidden lg:flex lg:flex-col flex-shrink-0 bg-gray-50 rounded-xl mx-4 my-4 shadow-[0_0_10px_rgba(0,0,0,0.03)] border border-gray-200/60 sticky top-24 max-h-[calc(100vh-120px)]" style={{ width: '288px' }}>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* All Products Button */}
              <button
                onClick={onAllProductsClick}
                className={`w-full flex items-center px-5 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 shadow-sm ${
                  !selectedCategoryId
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-200/50'
                    : 'text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/60 hover:border-gray-300'
                }`}
              >
                <CubeIcon className="w-5 h-5 mr-3" />
                All Products
              </button>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-4 px-2 uppercase tracking-wide">
                  Shop by Category
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
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CubeIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                      {categories === undefined ? 'Loading categories...' : 'No categories available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Price Filter */}
              <div className="pt-2">
                <hr className="border-gray-200 my-3" />
                <PriceRangeSlider
                  value={externalPriceRange || { min: '', max: '' }}
                  onChange={onPriceRangeChange || (() => {})}
                  minPrice={0}
                  maxPrice={maxPrice}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Sidebar - Only visible below lg breakpoint */}
        {!hideSidebar && (
          <aside className={`fixed top-14 sm:top-16 md:top-20 bottom-0 left-0 z-50 w-[85vw] max-w-sm bg-white shadow-lg border-r border-t border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* All Products Button */}
                <button
                  onClick={() => {
                    onAllProductsClick?.();
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-5 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 shadow-sm ${
                    !selectedCategoryId
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-200/50'
                      : 'text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/60 hover:border-gray-300'
                  }`}
                >
                  <CubeIcon className="w-5 h-5 mr-3" />
                  All Products
                </button>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-4 px-2 uppercase tracking-wide">
                    Shop by Category
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
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CubeIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        {categories === undefined ? 'Loading categories...' : 'No categories available'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Filter */}
                <div className="pt-2">
                  <hr className="border-gray-200 my-3" />
                  <PriceRangeSlider
                    value={externalPriceRange || { min: '', max: '' }}
                    onChange={onPriceRangeChange || (() => {})}
                    minPrice={0}
                    maxPrice={maxPrice}
                  />
                </div>
              </div>

              {/* Mobile Apply Button */}
              <div className="p-6 border-t border-gray-200 bg-white">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <StorefrontFooter settings={storeSettings} />
    </div>
  );
};

export default StorefrontLayout;
