import React, { useRef, useState, useEffect } from 'react';
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
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const checkScroll = () => {
    const container = categoriesContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftButton(scrollLeft > 10);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = categoriesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (categoriesContainerRef.current) {
      const scrollAmount = 300;
      categoriesContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Get only root categories (no parentId)
  const rootCategories = categories.filter(cat => !cat.parentId);

  return (
    <div className="w-full py-4">
      {/* Container centered with max-width */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Flex container to center everything together */}
        <div className="flex items-center justify-center">
          {/* "All Categories" button - Always visible, not scrollable */}
          <div className="flex-shrink-0 mr-4">
            <button
              onClick={onShowAllClick}
              className="flex flex-col items-center justify-center w-28 sm:w-36 h-36 sm:h-44 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 group/card"
            >
              <Squares2X2Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white mb-2" />
              <span className="text-white text-sm sm:text-base font-semibold text-center px-2 leading-tight">
                ყველა კატეგორია
              </span>
            </button>
          </div>

          {/* Categories carousel with scroll buttons */}
          <div className="relative w-full max-w-4xl">
            {/* Categories container - scrollable, centered */}
            <div
              ref={categoriesContainerRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide py-4 px-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* Category cards */}
              {rootCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className={`flex-shrink-0 relative w-28 sm:w-36 h-36 sm:h-44 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 group/card overflow-hidden bg-gray-200 hover:bg-gray-300 ${
                    selectedCategoryId === category.id
                      ? 'border-2 border-black'
                      : 'border-2 border-transparent'
                  }`}
                >
                  {category.image ? (
                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center" />
                      <span className="absolute inset-0 flex items-center justify-center text-white text-sm sm:text-base font-semibold text-center px-2 leading-tight">
                        {category.name}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center">
                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl text-gray-400">
                          📦
                        </span>
                      </div>
                      
                      {/* Text centered */}
                      <span className="relative text-sm sm:text-base font-semibold text-center px-2 leading-tight z-10 text-gray-900">
                        {category.name}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Fade overlay on left */}
            {showLeftButton && (
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50 via-gray-50/60 via-gray-50/30 to-transparent pointer-events-none" />
            )}

            {/* Fade overlay on right */}
            {showRightButton && (
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 via-gray-50/60 via-gray-50/30 to-transparent pointer-events-none" />
            )}

            {/* Left scroll button - positioned at edge */}
            {showLeftButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  scroll('left');
                }}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all pointer-events-auto"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Right scroll button - positioned at edge */}
            {showRightButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  scroll('right');
                }}
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all pointer-events-auto"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;

