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
  sidebarSelectedColor?: string;
  sidebarHoverColor?: string;
  sidebarTextColor?: string;
  sidebarSelectedTextColor?: string;
  sidebarDividerColor?: string;
}

const StorefrontCategoryList: React.FC<StorefrontCategoryListProps> = ({
  categories,
  onSelect,
  selectedCategoryId,
  expandedCategoryIds = [],
  sidebarSelectedColor = '#e5e5e5',
  sidebarHoverColor = '#e5e5e580',
  sidebarTextColor = '#525252',
  sidebarSelectedTextColor = '#171717',
  sidebarDividerColor = '#e5e5e5',
}) => {
  // Initialize with expandedCategoryIds
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set(expandedCategoryIds));

  // Sync expanded nodes with incoming expandedCategoryIds
  useEffect(() => {
    setExpandedNodes(new Set(expandedCategoryIds));
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

  const handleCategorySelect = (category: Category) => {
    onSelect?.(category.id);
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
            isSelected ? 'font-medium' : ''
          }`}
          style={{
            marginLeft: `${level * 20}px`,
            backgroundColor: isSelected ? sidebarSelectedColor : 'transparent',
            color: isSelected ? sidebarSelectedTextColor : sidebarTextColor,
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = sidebarHoverColor;
              e.currentTarget.style.color = sidebarSelectedTextColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = sidebarTextColor;
            }
          }}
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
                  ? 'text-neutral-700 bg-neutral-200'
                  : 'text-neutral-400 group-hover:text-neutral-600 group-hover:bg-neutral-200'
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
            onClick={() => handleCategorySelect(category)}
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
          <div className="mt-1 ml-2 border-l pl-2" style={{ borderColor: sidebarDividerColor }}>
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

