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
            className={`flex items-center py-2.5 px-3 rounded-xl group transition-all duration-200 ${
              isSelected
                ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 shadow-sm'
                : isDraft
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 hover:from-yellow-100 hover:to-yellow-200/50 border border-yellow-200'
                  : 'hover:bg-gray-100/80 hover:shadow-sm'
            }`}
            style={{ marginLeft: `${level * 16}px` }}
          >
            {/* Expand/Collapse Button */}
            <button
              onClick={() => hasChildren && toggleExpanded(category.id)}
              className="w-5 h-5 flex items-center justify-center mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )
              ) : (
                <div className="w-5 h-5" />
              )}
            </button>

            {/* Category Info */}
            <button
              onClick={() => onSelect?.(category.id)}
              className="flex-1 min-w-0 text-left hover:text-blue-600 transition-colors"
            >
              <div className="flex items-center">
                {level === 0 ? (
                  <FolderIcon className={`w-4 h-4 mr-3 ${isDraft ? 'text-yellow-600' : isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                ) : (
                  <TagIcon className={`w-4 h-4 mr-3 ${isDraft ? 'text-yellow-600' : isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                )}
                <span className={`truncate font-medium ${
                  isDraft
                    ? 'text-yellow-800 text-sm'
                    : isSelected
                      ? 'text-blue-800 text-sm'
                      : level === 0
                        ? 'text-gray-900 text-sm font-semibold'
                        : 'text-gray-600 text-sm hover:text-gray-900'
                }`}>
                  {category.name}
                </span>
                {showProductCounts && (category._recursiveCount !== undefined || category._count) && (
                  <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${
                    (category._recursiveCount || category._count?.products || 0) > 0
                      ? isSelected 
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600'
                      : 'bg-gray-100 text-gray-400'
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
          className={`flex items-center py-2 px-3 rounded-lg group ${
            isSelected 
              ? 'bg-blue-50 border border-blue-200' 
              : isDraft 
                ? 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200' 
                : 'hover:bg-gray-50'
          }`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => hasChildren && toggleExpanded(category.id)}
            className="w-4 h-4 flex items-center justify-center mr-2 text-gray-400 hover:text-gray-600"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Category Icon */}
          <div className={`w-5 h-5 mr-2 ${isDraft ? 'text-yellow-600' : 'text-gray-500'}`}>
            {level === 0 ? (
              <FolderIcon className="w-5 h-5" />
            ) : (
              <TagIcon className="w-5 h-5" />
            )}
          </div>

          {/* Category Info */}
          <button
            onClick={() => onSelect?.(category.id)}
            className="flex-1 min-w-0 text-left hover:text-blue-600 transition-colors"
          >
            <div className="flex items-center">
              <span className={`text-sm font-medium truncate ${isDraft ? 'text-yellow-800' : 'text-gray-900'}`}>
                {category.name}
              </span>
              {showProductCounts && (category._recursiveCount !== undefined || category._count) && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  (category._recursiveCount || category._count?.products || 0) > 0 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'bg-gray-50 text-gray-400 border border-gray-200'
                }`}>
                  {category._recursiveCount || category._count?.products || 0}
                </span>
              )}
            </div>
            {category.description && (
              <div className={`text-xs truncate ${isDraft ? 'text-yellow-600' : 'text-gray-500'}`}>
                {category.description}
              </div>
            )}
          </button>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddChild?.(category.id)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Add subcategory"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit?.(category)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Edit category"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(category)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Delete category"
            >
              <TrashIcon className="w-4 h-4" />
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
