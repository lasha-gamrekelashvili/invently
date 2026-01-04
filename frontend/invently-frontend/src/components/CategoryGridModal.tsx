import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string | null;
  children?: Category[];
  _count?: {
    products: number;
  };
  _recursiveCount?: number;
}

interface CategoryGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
  selectedCategoryId?: string;
}

const CategoryGridModal: React.FC<CategoryGridModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategorySelect,
  selectedCategoryId,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Build category tree
  const buildTree = (cats: Category[], parentId: string | null = null): Category[] => {
    return cats
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: buildTree(cats, cat.id)
      }));
  };

  const rootCategories = buildTree(categories);

  const handleCategoryClick = (category: Category) => {
    if (category.children && category.children.length > 0) {
      // Toggle expansion
      setExpandedCategory(expandedCategory === category.id ? null : category.id);
    } else {
      onCategorySelect(category.id);
      onClose();
    }
  };

  const handleSubcategoryClick = (categoryId: string) => {
    onCategorySelect(categoryId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed top-14 sm:top-16 md:top-20 left-0 right-0 bottom-0 bg-black/20 z-40 transition-opacity duration-500 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-down Panel */}
      <div 
        className={`fixed top-14 sm:top-16 md:top-20 left-0 right-0 z-50 bg-gray-50 shadow-2xl transition-all duration-500 ease-out overflow-hidden origin-top ${
          isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
        }`}
        style={{ 
          maxHeight: 'calc(90vh - 80px)',
          height: 'auto'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 bg-white border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              ყველა კატეგორია
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ overscrollBehavior: 'contain', minHeight: 0 }}>
            <div className="max-w-5xl mx-auto">
              {/* All root categories */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {rootCategories.map((category, index) => {
                  const hasChildren = category.children && category.children.length > 0;
                  const isExpanded = expandedCategory === category.id;

                  return (
                    <React.Fragment key={category.id}>
                      <button
                        onClick={() => handleCategoryClick(category)}
                        className={`relative bg-white rounded-xl p-3 transition-all hover:shadow-md group border ${
                          isExpanded 
                            ? 'border-blue-300 ring-2 ring-blue-100' 
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {/* Category Image/Icon */}
                        <div className="w-full aspect-square rounded-lg mb-2 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:bg-gray-100 transition-colors">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl sm:text-3xl">📦</span>
                          )}
                        </div>

                        {/* Category Name */}
                        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 text-center leading-tight line-clamp-2">
                          {category.name}
                        </h3>

                        {/* Product count */}
                        {category._recursiveCount !== undefined && (
                          <p className="text-xs text-gray-500 text-center mt-1">
                            {category._recursiveCount} ნივთი
                          </p>
                        )}

                        {/* Arrow indicator for categories with children */}
                        {hasChildren && (
                          <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isExpanded 
                              ? 'bg-blue-100 rotate-90' 
                              : 'bg-gray-900/5 group-hover:bg-gray-900/10'
                          }`}>
                            <ChevronRightIcon className={`w-3 h-3 ${isExpanded ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>
                        )}
                      </button>

                      {/* Expanded subcategories - shown as full-width section after this category */}
                      {isExpanded && hasChildren && (
                        <div className="col-span-3 sm:col-span-4 lg:col-span-5 xl:col-span-6 -mx-1">
                          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-2">
                            <div className="flex flex-wrap gap-2">
                              {/* Parent category "View All" button */}
                              <button
                                onClick={() => handleSubcategoryClick(category.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                              >
                                <span className="text-base">📦</span>
                                <span>{category.name}</span>
                                <span className="text-xs opacity-90">ყველას ნახვა</span>
                                <ArrowRightIcon className="w-3.5 h-3.5" />
                              </button>

                              {/* Subcategories as horizontal buttons */}
                              {category.children?.map((subcategory) => (
                                <button
                                  key={subcategory.id}
                                  onClick={() => handleSubcategoryClick(subcategory.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-all text-sm font-medium group"
                                >
                                  <span className="text-base">📦</span>
                                  <span>{subcategory.name}</span>
                                  {subcategory._recursiveCount !== undefined && (
                                    <span className="text-xs text-gray-500">
                                      {subcategory._recursiveCount}
                                    </span>
                                  )}
                                  <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryGridModal;

