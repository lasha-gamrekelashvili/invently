import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardPath } from '../hooks/useDashboardPath';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { T } from './Translation';

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
  const { path } = useDashboardPath();
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
      <nav className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-500">
        <HomeIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
        <span><T tKey="categories.breadcrumb.allCategories" /></span>
      </nav>
    );
  }

  return (
    <nav className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
      <Link
        to={path('categories')}
        className="flex items-center text-gray-500 hover:text-gray-700"
        onClick={() => onCategorySelect?.('')}
      >
        <HomeIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
        <T tKey="categories.breadcrumb.root" />
      </Link>
      
      {breadcrumb.map((category, index) => (
        <React.Fragment key={category.id}>
          <ChevronRightIcon className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 flex-shrink-0" />
          {index === breadcrumb.length - 1 ? (
            <span className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-none">{category.name}</span>
          ) : (
            <button
              onClick={() => onCategorySelect?.(category.id)}
              className="text-neutral-900 hover:text-neutral-700 hover:underline truncate max-w-[80px] sm:max-w-none"
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
