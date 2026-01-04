import React, { useRef } from 'react';
import { Squares2X2Icon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  image?: string;
  _count?: {
    products: number;
  };
  _recursiveCount?: number;
}

interface CategoryCarouselProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
  onShowAllClick: () => void;
  selectedCategoryId?: string;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  onCategorySelect,
  onShowAllClick,
  selectedCategoryId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Get only root categories (no parentId)
  const rootCategories = categories.filter(cat => !cat.parentId);

  return (
    <div className="relative group">
      {/* Left scroll button */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 disabled:opacity-0"
        aria-label="Scroll left"
      >
        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
      </button>

      {/* Carousel container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-2 px-1"
      >
        {/* "All Categories" button */}
        <button
          onClick={onShowAllClick}
          className="flex-shrink-0 flex flex-col items-center justify-center w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 group/card"
        >
          <Squares2X2Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white mb-2" />
          <span className="text-white text-xs sm:text-sm font-semibold text-center px-2 leading-tight">
            ყველა კატეგორია
          </span>
        </button>

        {/* Category cards */}
        {rootCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-24 sm:w-32 h-24 sm:h-32 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 group/card ${
              selectedCategoryId === category.id
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-400'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            {category.image ? (
              <div className="w-full h-full rounded-xl overflow-hidden relative">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-0 right-0 text-white text-xs sm:text-sm font-semibold text-center px-2 leading-tight">
                  {category.name}
                </span>
              </div>
            ) : (
              <>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg mb-2 flex items-center justify-center ${
                  selectedCategoryId === category.id
                    ? 'bg-white/20'
                    : 'bg-gray-100 group-hover/card:bg-gray-200'
                }`}>
                  <span className={`text-2xl ${
                    selectedCategoryId === category.id ? 'text-white' : 'text-gray-400'
                  }`}>
                    📦
                  </span>
                </div>
                <span className={`text-xs sm:text-sm font-semibold text-center px-2 leading-tight ${
                  selectedCategoryId === category.id ? 'text-white' : 'text-gray-900'
                }`}>
                  {category.name}
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Right scroll button */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 disabled:opacity-0"
        aria-label="Scroll right"
      >
        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};

export default CategoryCarousel;

