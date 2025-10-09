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
      .filter(cat => cat.parentId === parentId)
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
            className={`flex items-center py-1.5 px-2 rounded-md group ${
              isSelected
                ? 'bg-blue-50/70 border border-blue-200/50'
                : isDraft
                  ? 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                  : 'hover:bg-gray-50'
            }`}
            style={{ marginLeft: `${level * 16}px` }}
          >
            {/* Expand/Collapse Button */}
            <button
              onClick={() => hasChildren && toggleExpanded(category.id)}
              className="w-4 h-4 flex items-center justify-center mr-1.5 text-gray-500 hover:text-gray-700"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronRightIcon className="w-3 h-3" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            {/* Category Info */}
            <button
              onClick={() => onSelect?.(category.id)}
              className="flex-1 min-w-0 text-left hover:text-blue-600 transition-colors"
            >
              <div className="flex items-center">
                {level === 0 ? (
                  <FolderIcon className={`w-3.5 h-3.5 mr-2 ${isDraft ? 'text-yellow-600' : 'text-gray-500'}`} />
                ) : (
                  <TagIcon className={`w-3.5 h-3.5 mr-2 ${isDraft ? 'text-yellow-600' : 'text-gray-500'}`} />
                )}
                <span className={`truncate ${
                  isDraft
                    ? 'text-yellow-800 font-medium text-sm'
                    : level === 0
                      ? 'text-gray-700 font-medium text-sm'
                      : 'text-gray-700 font-normal text-xs'
                }`}>
                  {category.name}
                </span>
                {showProductCounts && (category._recursiveCount !== undefined || category._count) && (
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                    (category._recursiveCount || category._count?.products || 0) > 0
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-gray-50 text-gray-400'
                  }`}>
                    {category._recursiveCount || category._count?.products || 0}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Children in compact mode */}
          {hasChildren && isExpanded && (
            <div>
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
        tree.map(category => renderCategoryNode(category, 0, false))
      )}
    </div>
  );
};

export default CategoryTree;
