import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}

interface StorefrontCategoryListProps {
  categories: Category[];
  onSelect?: (categoryId: string) => void;
  selectedCategoryId?: string;
}

const StorefrontCategoryList: React.FC<StorefrontCategoryListProps> = ({
  categories,
  onSelect,
  selectedCategoryId,
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

  const renderCategoryNode = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center py-2 px-3 rounded-lg transition-colors ${
            isSelected
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="w-4 h-4 flex items-center justify-center mr-2 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3.5 h-3.5" />
              ) : (
                <ChevronRightIcon className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4 mr-2" />
          )}

          {/* Category Name */}
          <button
            onClick={() => onSelect?.(category.id)}
            className={`flex-1 text-left text-sm ${
              level === 0 ? 'font-medium' : ''
            }`}
          >
            {category.name}
          </button>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {category.children!.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(categories);

  return (
    <div className="space-y-0.5">
      {tree.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No categories available</p>
        </div>
      ) : (
        tree.map((category) => (
          <div key={category.id}>
            {renderCategoryNode(category, 0)}
          </div>
        ))
      )}
    </div>
  );
};

export default StorefrontCategoryList;

