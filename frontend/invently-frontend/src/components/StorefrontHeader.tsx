import React, { useState } from 'react';
import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';
import LandingHeader from './LandingHeader';

interface StorefrontHeaderProps {
  storeInfo?: {
    name: string;
    description?: string;
  };
  onMenuClick: () => void;
  onCartClick: () => void;
  onSearchChange?: (query: string) => void;
  gridLayout?: number;
  onGridLayoutChange?: (layout: number) => void;
  searchQuery?: string;
  isCartOpen?: boolean;
  isSidebarOpen?: boolean;
}

const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  storeInfo,
  onMenuClick,
  onCartClick,
  onSearchChange,
  gridLayout = 3,
  onGridLayoutChange,
  searchQuery = '',
  isCartOpen = false,
  isSidebarOpen = false,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { cartItemCount } = useCart();

  // Sync with parent when prop changes
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
  };

  return (
    <LandingHeader 
      showAuthButtons={false}
      shopName={storeInfo?.name || ''}
      mobileMenuButton={
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-md transition-all ${
            isSidebarOpen
              ? 'text-blue-600 bg-blue-50 ring-1 ring-blue-400'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      }
      mobileSearchButton={
        <button
          onClick={toggleMobileSearch}
          className="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="h-6 w-6" />
        </button>
      }
      centerContent={
        <div className="flex items-center gap-3 w-full">
          {/* Search Bar - Desktop always visible */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Grid Layout Selector - Only show when there are multiple options */}
          <div className="hidden lg:flex items-center space-x-1">
            {[
              { layout: 2, icon: 'grid-2', hideBelow: '' }, // Always show (when container is visible)
              { layout: 3, icon: 'grid-3', hideBelow: 'lg' }, // Hide below lg (1024px)
              { layout: 4, icon: 'grid-4', hideBelow: 'xl' } // Hide below xl (1280px)
            ].map(({ layout, icon, hideBelow }) => (
              <button
                key={layout}
                onClick={() => onGridLayoutChange?.(layout)}
                className={`p-2 rounded-lg transition-all ${
                  gridLayout === layout
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${
                  hideBelow === 'xl' ? 'hidden xl:block' : 
                  hideBelow === 'lg' ? 'hidden lg:block' : ''
                }`}
                title={`${layout} items per row`}
              >
                {icon === 'grid-2' && (
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                )}
                {icon === 'grid-3' && (
                  <div className="w-4 h-4 grid grid-cols-3 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                )}
                {icon === 'grid-4' && (
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      }
      rightActions={
        <button
          onClick={onCartClick}
          className={`relative p-2 rounded-xl transition-all group ${
            isCartOpen
              ? 'text-blue-600 bg-blue-50 ring-1 ring-blue-400 shadow-md shadow-blue-100/50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          aria-label="Shopping cart"
        >
          <ShoppingBagIcon className={`h-6 w-6 transition-transform ${isCartOpen ? 'scale-110' : ''}`} />
          {cartItemCount > 0 && (
            <span className={`absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white transition-all ${
              isCartOpen 
                ? 'bg-blue-600 scale-110 ring-blue-50' 
                : 'bg-blue-600 group-hover:scale-110'
            }`}>
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </button>
      }
      showLanguageSelector={true}
      mobileSearchExpanded={mobileSearchOpen}
      mobileSearchContent={
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              autoFocus
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={toggleMobileSearch}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    />
  );
};

export default StorefrontHeader;