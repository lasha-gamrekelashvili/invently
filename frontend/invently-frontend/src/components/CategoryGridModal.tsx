import React, { useState } from 'react';
import { XMarkIcon, ChevronRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
  const [viewMode, setViewMode] = useState<'grid' | 'expanded'>('grid');

  if (!isOpen) return null;

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
      setExpandedCategory(category.id);
      setViewMode('expanded');
    } else {
      onCategorySelect(category.id);
      onClose();
    }
  };

  const handleSubcategoryClick = (categoryId: string) => {
    onCategorySelect(categoryId);
    onClose();
  };

  const handleBack = () => {
    setViewMode('grid');
    setExpandedCategory(null);
  };

  const selectedExpandedCategory = rootCategories.find(c => c.id === expandedCategory);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-0 bottom-0 sm:inset-4 sm:top-20 sm:bottom-auto sm:max-h-[80vh] bg-white z-50 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {viewMode === 'expanded' && selectedExpandedCategory
              ? selectedExpandedCategory.name
              : 'ყველა კატეგორია'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {viewMode === 'grid' ? (
            /* Grid view - All root categories */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {rootCategories.map((category) => {
                const hasChildren = category.children && category.children.length > 0;
                const isSelected = selectedCategoryId === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className={`relative flex flex-col items-center p-4 sm:p-6 rounded-xl transition-all hover:shadow-lg group ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Category Image/Icon */}
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg mb-3 flex items-center justify-center overflow-hidden ${
                      isSelected ? 'bg-blue-200' : 'bg-gray-200 group-hover:bg-gray-300'
                    }`}>
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>

                    {/* Category Name */}
                    <span className={`text-sm sm:text-base font-semibold text-center leading-tight mb-1 ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {category.name}
                    </span>

                    {/* Product count or arrow */}
                    {hasChildren ? (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <ChevronRightIcon className="w-4 h-4" />
                      </div>
                    ) : (
                      category._recursiveCount !== undefined && (
                        <span className="text-xs text-gray-500 mt-1">
                          {category._recursiveCount} ნივთი
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Expanded view - Subcategories */
            <div>
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 rotate-180 mr-1" />
                <span className="text-sm font-medium">უკან</span>
              </button>

              {/* Parent category card */}
              <button
                onClick={() => handleSubcategoryClick(selectedExpandedCategory!.id)}
                className="w-full flex items-center justify-between p-4 mb-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                    {selectedExpandedCategory?.image ? (
                      <img
                        src={selectedExpandedCategory.image}
                        alt={selectedExpandedCategory.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{selectedExpandedCategory?.name}</div>
                    <div className="text-xs text-blue-100">ყველას ნახვა</div>
                  </div>
                </div>
                <ArrowRightIcon className="w-5 h-5" />
              </button>

              {/* Subcategories */}
              <div className="space-y-2">
                {selectedExpandedCategory?.children?.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategoryClick(subcategory.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 group-hover:bg-gray-300 rounded-lg flex items-center justify-center mr-3 transition-colors">
                        {subcategory.image ? (
                          <img
                            src={subcategory.image}
                            alt={subcategory.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{subcategory.name}</div>
                        {subcategory._recursiveCount !== undefined && (
                          <div className="text-xs text-gray-500">
                            {subcategory._recursiveCount} ნივთი
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryGridModal;

