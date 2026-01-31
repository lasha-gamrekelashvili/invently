import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, PencilIcon, TrashIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  _count?: {
    products: number;
  };
  _recursiveCount?: number;
}

interface CategoryTreeProps {
  categories: Category[];
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onAddChild?: (parentId: string) => void;
  onSelect?: (categoryId: string) => void;
  selectedCategoryId?: string;
  showProductCounts?: boolean;
  compact?: boolean;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onEdit,
  onDelete,
  onAddChild,
  onSelect,
  selectedCategoryId,
  showProductCounts = true,
  compact = false
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const buildTree = (categories: Category[], parentId: string | null = null): Category[] => {
    return categories
      .filter(cat => {
        // Handle both null and undefined for root categories
        if (parentId === null) {
          return cat.parentId === null || cat.parentId === undefined;
        }
        return cat.parentId === parentId;
      })
      .map(cat => ({
        ...cat,
        children: buildTree(categories, cat.id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Check if category or any of its children are in draft status
  const isCategoryOrChildrenDraft = (category: Category): boolean => {
    if (!category.isActive) return true;
    if (category.children && category.children.length > 0) {
      return category.children.some(child => isCategoryOrChildrenDraft(child));
    }
    return false;
  };

  // Check if a category should be styled as draft (either itself is draft OR parent has draft children)
  const shouldStyleAsDraft = (category: Category, parentIsDraft: boolean = false): boolean => {
    return !category.isActive || parentIsDraft;
  };

  const renderCategoryNode = (category: Category, level: number = 0, parentIsDraft: boolean = false) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const isDraft = shouldStyleAsDraft(category, parentIsDraft);

    if (compact) {
      return (
        <div key={category.id} className="select-none">
          <div
            className={`flex items-center py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl group transition-all duration-200 ${
              isSelected
                ? 'bg-neutral-100 border border-neutral-200 shadow-sm'
                : isDraft
                  ? 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200'
                  : 'hover:bg-neutral-50 hover:shadow-sm'
            }`}
            style={{ marginLeft: `${level * 12}px` }}
          >
            {/* Expand/Collapse Button */}
            <button
              onClick={() => hasChildren && toggleExpanded(category.id)}
              className="w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center mr-1.5 sm:mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDownIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                ) : (
                  <ChevronRightIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                )
              ) : (
                <div className="w-4 sm:w-5 h-4 sm:h-5" />
              )}
            </button>

            {/* Category Info */}
            <button
              onClick={() => onSelect?.(category.id)}
              className="flex-1 min-w-0 text-left hover:text-neutral-900 transition-colors"
            >
              <div className="flex items-center">
                {level === 0 ? (
                  <FolderIcon className={`w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3 flex-shrink-0 ${isDraft ? 'text-neutral-500' : isSelected ? 'text-neutral-900' : 'text-neutral-500'}`} />
                ) : (
                  <TagIcon className={`w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3 flex-shrink-0 ${isDraft ? 'text-neutral-500' : isSelected ? 'text-neutral-900' : 'text-neutral-500'}`} />
                )}
                <span className={`truncate font-medium ${
                  isDraft
                    ? 'text-neutral-600 text-xs sm:text-sm'
                    : isSelected
                      ? 'text-neutral-900 text-xs sm:text-sm'
                      : level === 0
                        ? 'text-neutral-900 text-xs sm:text-sm font-semibold'
                        : 'text-neutral-600 text-xs sm:text-sm hover:text-neutral-900'
                }`}>
                  {category.name}
                </span>
                {showProductCounts && (category._recursiveCount !== undefined || category._count) && (
                  <span className={`ml-auto text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium flex-shrink-0 ${
                    (category._recursiveCount || category._count?.products || 0) > 0
                      ? isSelected 
                        ? 'bg-neutral-200 text-neutral-900'
                        : 'bg-neutral-200 text-neutral-600'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    {category._recursiveCount || category._count?.products || 0}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Children in compact mode */}
          {hasChildren && isExpanded && (
            <div className="mt-1 space-y-1">
              {category.children!.map(child => renderCategoryNode(child, level + 1, !category.isActive))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg group ${
            isSelected 
              ? 'bg-neutral-100 border border-neutral-200' 
              : isDraft 
                ? 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200' 
                : 'hover:bg-neutral-50'
          }`}
          style={{ marginLeft: `${level * 12}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => hasChildren && toggleExpanded(category.id)}
            className="w-4 h-4 flex items-center justify-center mr-1.5 sm:mr-2 text-gray-400 hover:text-gray-600"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDownIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              ) : (
                <ChevronRightIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Category Icon */}
          <div className={`w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0 ${isDraft ? 'text-yellow-600' : 'text-gray-500'}`}>
            {level === 0 ? (
              <FolderIcon className="w-4 sm:w-5 h-4 sm:h-5" />
            ) : (
              <TagIcon className="w-4 sm:w-5 h-4 sm:h-5" />
            )}
          </div>

          {/* Category Info */}
          <button
            onClick={() => onSelect?.(category.id)}
            className="flex-1 min-w-0 text-left hover:text-neutral-900 transition-colors"
          >
            <div className="flex items-center">
              <span className={`text-xs sm:text-sm font-medium truncate ${isDraft ? 'text-neutral-600' : 'text-neutral-900'}`}>
                {category.name}
              </span>
              {showProductCounts && (category._recursiveCount !== undefined || category._count) && (
                <span className={`ml-1.5 sm:ml-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${
                  (category._recursiveCount || category._count?.products || 0) > 0 
                    ? 'bg-neutral-100 text-neutral-900 border border-neutral-200' 
                    : 'bg-neutral-50 text-neutral-400 border border-neutral-200'
                }`}>
                  {category._recursiveCount || category._count?.products || 0}
                </span>
              )}
            </div>
            {category.description && (
              <div className={`text-[10px] sm:text-xs truncate ${isDraft ? 'text-yellow-600' : 'text-gray-500'}`}>
                {category.description}
              </div>
            )}
          </button>

          {/* Action Buttons */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddChild?.(category.id)}
              className="p-1 text-neutral-400 hover:text-neutral-900 rounded"
              title="Add subcategory"
            >
              <PlusIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
            <button
              onClick={() => onEdit?.(category)}
              className="p-1 text-neutral-400 hover:text-neutral-900 rounded"
              title="Edit category"
            >
              <PencilIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
            <button
              onClick={() => onDelete?.(category)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Delete category"
            >
              <TrashIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategoryNode(child, level + 1, !category.isActive))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(categories);

  return (
    <div className="space-y-1">
      {tree.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FolderIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No categories yet</p>
        </div>
      ) : (
        tree.map((category, index) => (
          <div key={category.id}>
            {index > 0 && <div className="mt-2 mb-1" />}
            {renderCategoryNode(category, 0, false)}
          </div>
        ))
      )}
    </div>
  );
};

export default CategoryTree;
