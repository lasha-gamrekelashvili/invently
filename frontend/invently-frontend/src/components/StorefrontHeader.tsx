import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';

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
}

const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  storeInfo,
  onMenuClick,
  onCartClick,
  onSearchChange,
  gridLayout = 3,
  onGridLayoutChange,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { cartItemCount } = useCart();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Menu and Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                <ShoppingBagIcon className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {storeInfo?.name || 'Shop'}
                </h1>
                {storeInfo?.description && (
                  <p className="text-xs text-gray-500 hidden lg:block">{storeInfo.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Center: Search Bar with Grid Layout */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 hidden md:block">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="block w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Grid Layout Selector */}
              <div className="flex items-center space-x-1">
                {[
                  { layout: 2, icon: 'grid-2' },
                  { layout: 3, icon: 'grid-3' },
                  { layout: 4, icon: 'grid-4' }
                ].map(({ layout, icon }) => (
                  <button
                    key={layout}
                    onClick={() => onGridLayoutChange?.(layout)}
                    className={`p-2 rounded-lg transition-all ${
                      gridLayout === layout
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          </div>

          {/* Right: Cart Icon */}
          <div className="flex items-center space-x-2">
            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
              aria-label="Shopping cart"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white group-hover:scale-110 transition-transform">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default StorefrontHeader;