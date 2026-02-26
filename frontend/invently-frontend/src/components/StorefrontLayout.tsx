import React, { useState } from 'react';
import { Squares2X2Icon, FolderIcon } from '@heroicons/react/24/outline';
import StorefrontHeader from './StorefrontHeader';
import StorefrontFooter from './StorefrontFooter';
import StorefrontCategoryList from './StorefrontCategoryList';
import CategoryListSkeleton from './CategoryListSkeleton';

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

  // Get colors from settings with fallbacks
  const backgroundColor = storeSettings?.backgroundColor || '#fafafa';
  const sidebarBackgroundColor = storeSettings?.sidebarBackgroundColor || '#f5f5f5';
  const sidebarSelectedColor = storeSettings?.sidebarSelectedColor || '#e5e5e5';
  const sidebarHoverColor = storeSettings?.sidebarHoverColor || '#e5e5e580';
  const sidebarTextColor = storeSettings?.sidebarTextColor || '#525252';
  const sidebarSelectedTextColor = storeSettings?.sidebarSelectedTextColor || '#171717';
  const sidebarDividerColor = storeSettings?.sidebarDividerColor || '#e5e5e5';
  const sidebarBorderColor = storeSettings?.sidebarBorderColor || '#e5e5e5';
  const headerBackgroundColor = storeSettings?.headerBackgroundColor || '#ffffff';
  const headerTextColor = storeSettings?.headerTextColor || '#171717';
  const headerBorderColor = storeSettings?.headerBorderColor || '#e5e5e5';
  const footerBackgroundColor = storeSettings?.footerBackgroundColor || '#ffffff';
  const footerTextColor = storeSettings?.footerTextColor || '#171717';
  const footerHeadingColor = storeSettings?.footerHeadingColor || '#171717';
  const footerLinkColor = storeSettings?.footerLinkColor || '#525252';

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor }}>
      {/* Header */}
      <StorefrontHeader
        storeInfo={storeInfo}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onCartClick={onCartClick}
        onSearchChange={onSearchChange}
        searchQuery={searchQuery}
        isCartOpen={isCartOpen}
        isSidebarOpen={sidebarOpen}
        headerBackgroundColor={headerBackgroundColor}
        headerTextColor={headerTextColor}
        headerBorderColor={headerBorderColor}
        storeSettings={storeSettings}
        showCartButton={!!(storeSettings?.paymentsEnabled || storeSettings?.allowOrdersWithoutPayment)}
      />

      <div className="flex-1 flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && !hideSidebar && (
          <div
            className="fixed inset-0 z-40 bg-neutral-900 bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Sidebar - Always visible on large screens */}
        {!hideSidebar && (
          <aside className="hidden lg:flex lg:flex-col flex-shrink-0 border-r sticky top-14 sm:top-16 md:top-20 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]" style={{ width: '320px', backgroundColor: sidebarBackgroundColor, borderColor: sidebarBorderColor }}>
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* All Products — primary action card */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: sidebarBorderColor }}>
                  <button
                    onClick={onAllProductsClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all ${
                      !selectedCategoryId ? 'shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: !selectedCategoryId ? sidebarSelectedColor : 'transparent',
                      color: !selectedCategoryId ? sidebarSelectedTextColor : sidebarTextColor,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategoryId) {
                        e.currentTarget.style.backgroundColor = sidebarHoverColor;
                        e.currentTarget.style.color = sidebarSelectedTextColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategoryId) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = sidebarTextColor;
                      }
                    }}
                  >
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ backgroundColor: !selectedCategoryId ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)' }}>
                      <Squares2X2Icon className="w-5 h-5" style={{ color: !selectedCategoryId ? sidebarSelectedTextColor : sidebarTextColor }} />
                    </span>
                    All Products
                  </button>
                </div>

                {/* Categories — section card */}
                <div className="rounded-xl border overflow-hidden bg-white/50" style={{ borderColor: sidebarBorderColor }}>
                  <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: sidebarDividerColor, backgroundColor: 'rgba(0,0,0,0.03)' }}>
                    <FolderIcon className="w-4 h-4 shrink-0" style={{ color: sidebarTextColor }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: sidebarTextColor }}>
                      Categories
                    </span>
                  </div>
                  <div className="p-3">
                    {categoriesLoading ? (
                      <CategoryListSkeleton />
                    ) : categories && categories.length > 0 ? (
                      <StorefrontCategoryList
                        categories={categories}
                        onSelect={onCategorySelect}
                        selectedCategoryId={selectedCategoryId}
                        expandedCategoryIds={expandedCategoryIds}
                        sidebarSelectedColor={sidebarSelectedColor}
                        sidebarHoverColor={sidebarHoverColor}
                        sidebarTextColor={sidebarTextColor}
                        sidebarSelectedTextColor={sidebarSelectedTextColor}
                        sidebarDividerColor={sidebarDividerColor}
                      />
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm" style={{ color: sidebarTextColor }}>No categories available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Filter — Min / Max inputs */}
                <div className="rounded-xl border overflow-hidden bg-white/50" style={{ borderColor: sidebarBorderColor }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: sidebarDividerColor }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: sidebarTextColor }}>Price</span>
                  </div>
                  <div className="p-4">
                    {priceRangeLoading ? (
                      <div className="flex gap-2">
                        <div className="h-9 flex-1 rounded-lg bg-gray-200 animate-pulse" />
                        <div className="h-9 flex-1 rounded-lg bg-gray-200 animate-pulse" />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          max={maxPrice}
                          placeholder="Min"
                          value={(externalPriceRange?.min ?? '')}
                          onChange={(e) => (onPriceRangeChange || (() => {}))(e.target.value, externalPriceRange?.max ?? '')}
                          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
                          style={{ borderColor: sidebarBorderColor }}
                        />
                        <input
                          type="number"
                          min={0}
                          max={maxPrice}
                          placeholder="Max"
                          value={(externalPriceRange?.max ?? '')}
                          onChange={(e) => (onPriceRangeChange || (() => {}))(externalPriceRange?.min ?? '', e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
                          style={{ borderColor: sidebarBorderColor }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Sidebar Drawer - Only on mobile */}
        {!hideSidebar && (
          <aside className={`fixed top-14 sm:top-16 md:top-20 bottom-0 left-0 z-50 w-[85vw] max-w-sm border-r border-t transform transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ backgroundColor: sidebarBackgroundColor, borderColor: sidebarBorderColor }}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* All Products — primary action card */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: sidebarBorderColor }}>
                  <button
                    onClick={() => {
                      onAllProductsClick?.();
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all ${
                      !selectedCategoryId ? 'shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: !selectedCategoryId ? sidebarSelectedColor : 'transparent',
                      color: !selectedCategoryId ? sidebarSelectedTextColor : sidebarTextColor,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategoryId) {
                        e.currentTarget.style.backgroundColor = sidebarHoverColor;
                        e.currentTarget.style.color = sidebarSelectedTextColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategoryId) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = sidebarTextColor;
                      }
                    }}
                  >
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ backgroundColor: !selectedCategoryId ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)' }}>
                      <Squares2X2Icon className="w-5 h-5" style={{ color: !selectedCategoryId ? sidebarSelectedTextColor : sidebarTextColor }} />
                    </span>
                    All Products
                  </button>
                </div>

                {/* Categories — section card */}
                <div className="rounded-xl border overflow-hidden bg-white/50" style={{ borderColor: sidebarBorderColor }}>
                  <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: sidebarDividerColor, backgroundColor: 'rgba(0,0,0,0.03)' }}>
                    <FolderIcon className="w-4 h-4 shrink-0" style={{ color: sidebarTextColor }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: sidebarTextColor }}>
                      Categories
                    </span>
                  </div>
                  <div className="p-3">
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
                        sidebarSelectedColor={sidebarSelectedColor}
                        sidebarHoverColor={sidebarHoverColor}
                        sidebarTextColor={sidebarTextColor}
                        sidebarSelectedTextColor={sidebarSelectedTextColor}
                        sidebarDividerColor={sidebarDividerColor}
                      />
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm" style={{ color: sidebarTextColor }}>No categories available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Filter — Min / Max inputs */}
                <div className="rounded-xl border overflow-hidden bg-white/50" style={{ borderColor: sidebarBorderColor }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: sidebarDividerColor }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: sidebarTextColor }}>Price</span>
                  </div>
                  <div className="p-4">
                    {priceRangeLoading ? (
                      <div className="flex gap-2">
                        <div className="h-9 flex-1 rounded-lg bg-gray-200 animate-pulse" />
                        <div className="h-9 flex-1 rounded-lg bg-gray-200 animate-pulse" />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          max={maxPrice}
                          placeholder="Min"
                          value={(externalPriceRange?.min ?? '')}
                          onChange={(e) => (onPriceRangeChange || (() => {}))(e.target.value, externalPriceRange?.max ?? '')}
                          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
                          style={{ borderColor: sidebarBorderColor }}
                        />
                        <input
                          type="number"
                          min={0}
                          max={maxPrice}
                          placeholder="Max"
                          value={(externalPriceRange?.max ?? '')}
                          onChange={(e) => (onPriceRangeChange || (() => {}))(externalPriceRange?.min ?? '', e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
                          style={{ borderColor: sidebarBorderColor }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 px-3 sm:px-4 lg:px-16 py-6 w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <StorefrontFooter 
        settings={storeSettings}
        footerBackgroundColor={footerBackgroundColor}
        footerTextColor={footerTextColor}
        footerHeadingColor={footerHeadingColor}
        footerLinkColor={footerLinkColor}
      />
    </div>
  );
};

export default StorefrontLayout;
