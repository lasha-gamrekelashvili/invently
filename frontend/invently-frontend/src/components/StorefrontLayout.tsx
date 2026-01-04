import React from 'react';
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
  onCartClick,
  onSearchChange,
  gridLayout = 3,
  onGridLayoutChange,
  searchQuery = '',
  isCartOpen = false,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <StorefrontHeader
        storeInfo={storeInfo}
        onMenuClick={() => {}} 
        onCartClick={onCartClick}
        onSearchChange={onSearchChange}
        gridLayout={gridLayout}
        onGridLayoutChange={onGridLayoutChange}
        searchQuery={searchQuery}
        isCartOpen={isCartOpen}
        isSidebarOpen={false}
      />

      {/* Main content - Full width, no sidebar */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 w-full">
          <div className="max-w-[1920px] mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <StorefrontFooter settings={storeSettings} />
    </div>
  );
};

export default StorefrontLayout;
