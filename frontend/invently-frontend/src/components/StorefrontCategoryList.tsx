import React, { useState, useEffect } from 'react';
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
  expandedCategoryIds?: string[];
}

const StorefrontCategoryList: React.FC<StorefrontCategoryListProps> = ({
  categories,
  onSelect,
  selectedCategoryId,
  expandedCategoryIds = [],
}) => {
  // Initialize with expandedCategoryIds
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set(expandedCategoryIds));

  // Auto-expand categories when expandedCategoryIds changes
  useEffect(() => {
    if (expandedCategoryIds.length > 0) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        expandedCategoryIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [expandedCategoryIds]);

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
          className={`group flex items-center py-2.5 px-3 rounded-lg transition-all ${
            isSelected
              ? 'bg-neutral-100 text-neutral-900'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className={`w-5 h-5 flex items-center justify-center mr-2.5 rounded transition-all ${
                isExpanded
                  ? 'text-neutral-700 bg-neutral-100'
                  : 'text-neutral-400 group-hover:text-neutral-600 group-hover:bg-neutral-100'
              }`}
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5 mr-2.5 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-300"></div>
            </div>
          )}

          {/* Category Name */}
          <button
            onClick={() => onSelect?.(category.id)}
            className={`flex-1 text-left text-sm transition-colors ${
              level === 0 
                ? 'font-medium' 
                : 'font-normal'
            } ${
              isSelected ? 'text-neutral-900' : ''
            }`}
          >
            {category.name}
          </button>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 ml-2 border-l border-neutral-200 pl-2">
            {category.children!.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(categories);

  return (
    <div className="space-y-1">
      {tree.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
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

