import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedPath, setExpandedPath] = useState<string[]>([]); // Track path of expanded categories
  const [gridColumns, setGridColumns] = useState(6);
  
  // Color palette for subcategory icons (like Veli)
  const iconColors = [
    'bg-purple-200',
    'bg-yellow-200', 
    'bg-blue-200',
    'bg-pink-200',
    'bg-green-200',
    'bg-orange-200',
    'bg-indigo-200',
    'bg-red-200',
    'bg-teal-200',
  ];
  
  const getIconColor = (index: number) => iconColors[index % iconColors.length];

  // Detect grid columns based on screen size
  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      let newCols = 2;
      
      if (width >= 1024) { // lg
        newCols = 5;
      } else if (width >= 768) { // md
        newCols = 4;
      } else if (width >= 640) { // sm
        newCols = 3;
      } else {
        newCols = 2;
      }
      
      setGridColumns(newCols);
      // Close expanded categories on resize to prevent layout issues
      setExpandedCategory(null);
      setExpandedPath([]);
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

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
      .filter(cat => {
        // Handle both null and undefined for root categories
        if (parentId === null) {
          return cat.parentId === null || cat.parentId === undefined;
        }
        return cat.parentId === parentId;
      })
      .map(cat => ({
        ...cat,
        children: buildTree(cats, cat.id)
      }));
  };

  const rootCategories = buildTree(categories);

  const handleCategoryClick = (category: Category) => {
    if (category.children && category.children.length > 0) {
      // Toggle expansion
      const newExpanded = expandedCategory === category.id ? null : category.id;
      setExpandedCategory(newExpanded);
      // Reset nested expansion when changing main category
      setExpandedPath([]);
    } else {
      onCategorySelect(category.id);
      onClose();
    }
  };

  const handleNestedCategoryClick = (category: Category, depth: number) => {
    if (category.children && category.children.length > 0) {
      // Toggle expansion at this depth
      const newPath = [...expandedPath];
      if (newPath[depth] === category.id) {
        // Collapse this level and all deeper levels
        newPath.splice(depth);
      } else {
        // Expand this level and collapse deeper levels
        newPath.splice(depth);
        newPath[depth] = category.id;
      }
      setExpandedPath(newPath);
    } else {
      onCategorySelect(category.id);
      onClose();
    }
  };

  // Helper to determine if we should show subcategories after this index
  const shouldShowSubcategoriesAfter = (index: number, totalItems: number) => {
    if (!expandedCategory) return false;
    
    const expandedIndex = rootCategories.findIndex(cat => cat.id === expandedCategory);
    if (expandedIndex === -1) return false;
    
    const expandedRow = Math.floor(expandedIndex / gridColumns);
    const currentRow = Math.floor(index / gridColumns);
    const lastIndexInRow = (currentRow + 1) * gridColumns - 1;
    
    // Show subcategories after the last item in the row where expanded category is
    return currentRow === expandedRow && (index === lastIndexInRow || index === totalItems - 1);
  };

  // Recursive function to render nested categories
  const renderNestedCategories = (categories: Category[], depth: number = 0): React.ReactNode => {
    const expandedId = expandedPath[depth];
    const expandedCat = categories.find(cat => cat.id === expandedId);
    
    return (
      <>
        {/* Render all categories at this level */}
        {categories.map((category, idx) => {
          const hasChildren = category.children && category.children.length > 0;
          const isExpanded = expandedPath[depth] === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleNestedCategoryClick(category, depth)}
              className={`flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-900 rounded-xl transition-all text-sm font-medium shadow-sm ${
                isExpanded ? 'border-2 border-black' : 'border-2 border-gray-300'
              }`}
            >
              <div className={`w-7 h-7 rounded-full ${getIconColor(idx + depth)} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm">{category.name}</span>
              {hasChildren && (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ml-auto transition-transform ${
                  isExpanded ? 'bg-black rotate-90' : 'bg-gray-200'
                }`}>
                  <ChevronRightIcon className={`w-3 h-3 ${isExpanded ? 'text-white' : 'text-gray-600'}`} />
                </div>
              )}
            </button>
          );
        })}
        
        {/* Render children of expanded category at this level */}
        {expandedCat && expandedCat.children && expandedCat.children.length > 0 && (
          <div className="w-full border-t border-gray-200 pt-3 mt-2">
            <div className="flex flex-wrap gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
              {/* "View All" button for the expanded category */}
              <button
                onClick={() => {
                  onCategorySelect(expandedCat.id);
                  onClose();
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-900 rounded-xl transition-all text-sm font-medium border border-gray-300 shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-semibold">{expandedCat.name}</span>
                <span className="text-xs text-gray-500">ყველას ნახვა</span>
              </button>
              
              {/* Recursively render children */}
              {renderNestedCategories(expandedCat.children, depth + 1)}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed top-14 sm:top-16 md:top-20 left-0 right-0 bottom-0 bg-black/20 z-40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-down Panel */}
      <div 
        className={`fixed top-14 sm:top-16 md:top-20 left-0 right-0 z-50 bg-white shadow-2xl transition-all duration-200 ease-out overflow-hidden ${
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
        style={{ height: '50vh', maxHeight: '600px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 bg-white flex-shrink-0">
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
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6" style={{ overscrollBehavior: 'contain', minHeight: 0 }}>
            <div className="max-w-5xl mx-auto">
              {/* All root categories */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {rootCategories.map((category, index) => {
                  const hasChildren = category.children && category.children.length > 0;
                  const isExpanded = expandedCategory === category.id;
                  const showSubcategoriesAfter = shouldShowSubcategoriesAfter(index, rootCategories.length);

                  return (
                    <React.Fragment key={category.id}>
                      <button
                        onClick={() => handleCategoryClick(category)}
                        className={`relative w-full h-28 sm:h-32 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:scale-105 group bg-gray-200 hover:bg-gray-300 flex flex-col items-center justify-center ${
                          isExpanded 
                            ? 'border-2 border-black' 
                            : 'border-2 border-transparent'
                        }`}
                      >
                        {/* Category Image/Icon */}
                        {category.image && (
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover opacity-30"
                            />
                          </div>
                        )}

                        {/* Category Name and Count - Centered */}
                        <div className="relative z-10 text-center px-3">
                          <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2 mb-1 text-gray-900">
                            {category.name}
                          </h3>
                          {category._recursiveCount !== undefined && (
                            <p className="text-xs text-gray-700">
                              {category._recursiveCount} ნივთი
                            </p>
                          )}
                        </div>

                        {/* Arrow indicator - only show for categories with children */}
                        {hasChildren && (
                          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isExpanded 
                              ? 'bg-black rotate-90' 
                              : 'bg-white group-hover:bg-gray-100'
                          }`}>
                            <ChevronRightIcon className={`w-3.5 h-3.5 ${isExpanded ? 'text-white' : 'text-gray-700'}`} />
                          </div>
                        )}
                      </button>

                      {/* Expanded subcategories - shown after the complete row */}
                      {showSubcategoriesAfter && expandedCategory && (
                        <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 -mx-4 sm:-mx-6">
                          <div className="flex flex-wrap gap-2 py-2 px-4 sm:px-6">
                            {(() => {
                              const expandedCat = rootCategories.find(cat => cat.id === expandedCategory);
                              if (!expandedCat || !expandedCat.children) return null;
                              
                              return (
                                <>
                                  {/* Parent category "View All" button */}
                                  <button
                                    onClick={() => {
                                      onCategorySelect(expandedCat.id);
                                      onClose();
                                    }}
                                    className="flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-900 rounded-xl transition-all text-sm font-medium border border-gray-300 shadow-sm"
                                  >
                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <span className="text-sm font-semibold">{expandedCat.name}</span>
                                    <span className="text-xs text-gray-500">ყველას ნახვა</span>
                                  </button>

                                  {/* Render all nested categories recursively */}
                                  {renderNestedCategories(expandedCat.children, 0)}
                                </>
                              );
                            })()}
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

