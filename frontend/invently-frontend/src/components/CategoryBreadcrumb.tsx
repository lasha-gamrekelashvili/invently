import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

interface CategoryBreadcrumbProps {
  categories: Category[];
  currentCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
}

const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  categories,
  currentCategoryId,
  onCategorySelect
}) => {
  const buildBreadcrumb = (): Category[] => {
    if (!currentCategoryId) return [];
    
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const breadcrumb: Category[] = [];
    
    let current = categoryMap.get(currentCategoryId);
    while (current) {
      breadcrumb.unshift(current);
      current = current.parentId ? categoryMap.get(current.parentId) : undefined;
    }
    
    return breadcrumb;
  };

  const breadcrumb = buildBreadcrumb();

  if (breadcrumb.length === 0) {
    return (
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <HomeIcon className="w-4 h-4" />
        <span>All Categories</span>
      </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link
        to="/admin/categories"
        className="flex items-center text-gray-500 hover:text-gray-700"
        onClick={() => onCategorySelect?.('')}
      >
        <HomeIcon className="w-4 h-4 mr-1" />
        Root
      </Link>
      
      {breadcrumb.map((category, index) => (
        <React.Fragment key={category.id}>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          {index === breadcrumb.length - 1 ? (
            <span className="text-gray-900 font-medium">{category.name}</span>
          ) : (
            <button
              onClick={() => onCategorySelect?.(category.id)}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {category.name}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default CategoryBreadcrumb;
