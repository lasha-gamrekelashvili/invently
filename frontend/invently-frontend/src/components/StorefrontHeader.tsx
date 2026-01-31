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
  searchQuery?: string;
  isCartOpen?: boolean;
  isSidebarOpen?: boolean;
}

const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  onMenuClick,
  onCartClick,
  onSearchChange,
  searchQuery = '',
  isCartOpen = false,
  isSidebarOpen = false
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
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

  return (
    <LandingHeader 
      showAuthButtons={false}
      showLogo={false}
      mobileMenuButton={
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-md transition-all ${
            isSidebarOpen
              ? 'text-neutral-900 bg-neutral-100 ring-1 ring-neutral-300'
              : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      }
      centerContent={
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          {/* Search Bar - Always visible on all screens */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-8 sm:pl-10 md:pl-12 pr-2 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-2.5 border border-neutral-300 rounded-xl text-xs sm:text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      }
      rightActions={
        <button
          onClick={onCartClick}
          className={`relative p-2 rounded-xl transition-all group ${
            isCartOpen
              ? 'text-neutral-900 bg-neutral-100 ring-1 ring-neutral-300'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          aria-label="Shopping cart"
        >
          <ShoppingBagIcon className={`h-6 w-6 transition-transform ${isCartOpen ? 'scale-110' : ''}`} />
          {cartItemCount > 0 && (
            <span className={`absolute -top-1 -right-1 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white transition-all ${
              isCartOpen 
                ? 'bg-neutral-800 scale-110' 
                : 'bg-neutral-800 group-hover:scale-110'
            }`}>
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </button>
      }
      showLanguageSelector={true}
    />
  );
};

export default StorefrontHeader;