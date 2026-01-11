import React, { useState } from 'react';
import StorefrontHeader from './StorefrontHeader';
import StorefrontFooter from './StorefrontFooter';
import StorefrontCategoryList from './StorefrontCategoryList';
import CategoryListSkeleton from './CategoryListSkeleton';
import PriceRangeSlider from './PriceRangeSlider';
import PriceRangeSliderSkeleton from './PriceRangeSliderSkeleton';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  storeInfo?: {
    name: string;
    description?: string;
  };
  storeSettings?: any;
  categories?: any[];
  categoriesLoading?: boolean;
  selectedCategoryId?: string;
  expandedCategoryIds?: string[];
  onCategorySelect?: (categoryId: string) => void;
  onAllProductsClick?: () => void;
  onCartClick: () => void;
  onSearchChange?: (query: string) => void;
  onPriceRangeChange?: (min: string, max: string) => void;
  priceRange?: { min: string; max: string };
  maxPrice?: number;
  priceRangeLoading?: boolean;
  searchQuery?: string;
  isCartOpen?: boolean;
  hideSidebar?: boolean;
}

const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
  children,
  storeInfo,
  storeSettings,
  categories = [],
  categoriesLoading = false,
  selectedCategoryId,
  expandedCategoryIds = [],
  onCategorySelect,
  onAllProductsClick,
  onCartClick,
  onSearchChange,
  onPriceRangeChange,
  priceRange: externalPriceRange,
  maxPrice = 1000,
  priceRangeLoading = false,
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

        {/* Desktop Sidebar - Always visible on large screens */}
        {!hideSidebar && (
          <aside className="hidden lg:flex lg:flex-col flex-shrink-0 bg-white shadow-lg border-r border-gray-200 sticky top-14 sm:top-16 md:top-20 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]" style={{ width: '320px' }}>
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* All Products Button */}
                <button
                  onClick={onAllProductsClick}
                  className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                    !selectedCategoryId
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  All Products
                </button>

                {/* Categories */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-3 px-3 uppercase tracking-wider">
                    Categories
                  </h3>
                  {categoriesLoading ? (
                    <CategoryListSkeleton />
                  ) : categories && categories.length > 0 ? (
                    <StorefrontCategoryList
                      categories={categories}
                      onSelect={onCategorySelect}
                      selectedCategoryId={selectedCategoryId}
                      expandedCategoryIds={expandedCategoryIds}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No categories available</p>
                    </div>
                  )}
                </div>

                {/* Price Filter */}
                <div className="pt-2">
                  <hr className="border-gray-200 my-3" />
                  {priceRangeLoading ? (
                    <PriceRangeSliderSkeleton />
                  ) : (
                    <PriceRangeSlider
                      value={externalPriceRange || { min: '', max: '' }}
                      onChange={onPriceRangeChange || (() => {})}
                      minPrice={0}
                      maxPrice={maxPrice}
                    />
                  )}
                </div>
              </div>

              {/* Desktop Apply Button */}
              <div className="p-5 border-t border-gray-200 bg-white">
                <button
                  onClick={onAllProductsClick}
                  className="w-full bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Sidebar Drawer - Only on mobile */}
        {!hideSidebar && (
          <aside className={`fixed top-14 sm:top-16 md:top-20 bottom-0 left-0 z-50 w-[85vw] max-w-sm bg-white shadow-lg border-r border-t border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* All Products Button */}
                <button
                  onClick={() => {
                    onAllProductsClick?.();
                    setSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                    !selectedCategoryId
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  All Products
                </button>

                {/* Categories */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-3 px-3 uppercase tracking-wider">
                    Categories
                  </h3>
                  {categoriesLoading ? (
                    <CategoryListSkeleton />
                  ) : categories && categories.length > 0 ? (
                    <StorefrontCategoryList
                      categories={categories}
                      onSelect={(id) => {
                        onCategorySelect?.(id);
                        setSidebarOpen(false);
                      }}
                      selectedCategoryId={selectedCategoryId}
                      expandedCategoryIds={expandedCategoryIds}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No categories available</p>
                    </div>
                  )}
                </div>

                {/* Price Filter */}
                <div className="pt-2">
                  <hr className="border-gray-200 my-3" />
                  {priceRangeLoading ? (
                    <PriceRangeSliderSkeleton />
                  ) : (
                    <PriceRangeSlider
                      value={externalPriceRange || { min: '', max: '' }}
                      onChange={onPriceRangeChange || (() => {})}
                      minPrice={0}
                      maxPrice={maxPrice}
                    />
                  )}
                </div>
              </div>

              {/* Mobile Apply Button */}
              <div className="p-5 border-t border-gray-200 bg-white">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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
