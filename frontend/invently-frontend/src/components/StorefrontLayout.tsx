import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderIcon, 
  CubeIcon, 
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import CategoryTree from './CategoryTree';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  storeInfo?: {
    name: string;
    description?: string;
  };
  categories?: any[];
  selectedCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
  onAllProductsClick?: () => void;
}

const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
  children,
  storeInfo,
  categories = [],
  selectedCategoryId,
  onCategorySelect,
  onAllProductsClick
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <ShoppingBagIcon className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">
                {storeInfo?.name || 'Shop'}
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="space-y-1">
              <button
                onClick={onAllProductsClick}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 w-full text-left"
              >
                <CubeIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500" />
                All Products
              </button>
            </div>

            {/* Categories Section */}
            <div className="mt-8">
              <div className="flex items-center px-3 py-2">
                <FolderIcon className="w-5 h-5 mr-2 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Categories
                </h3>
              </div>
              
              {categories && categories.length > 0 ? (
                <div className="mt-2">
                  <CategoryTree
                    categories={categories}
                    onSelect={onCategorySelect}
                    selectedCategoryId={selectedCategoryId}
                    showProductCounts={true}
                    compact={true}
                  />
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {categories === undefined ? 'Loading categories...' : 'No categories available'}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Powered by Invently
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile menu button */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
          <div className="px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StorefrontLayout;
