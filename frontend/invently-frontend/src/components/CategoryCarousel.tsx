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
              className="flex flex-col items-center justify-center w-28 sm:w-36 h-28 sm:h-36 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 group/card"
            >
              <Squares2X2Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white mb-2" />
              <span className="text-white text-sm sm:text-base font-semibold text-center px-2 leading-tight">
                ყველა კატეგორია
              </span>
            </button>
          </div>

          {/* Categories carousel with scroll buttons */}
          <div className="relative overflow-hidden" style={{ maxWidth: 'calc(100vw - 200px)' }}>
            {/* Left scroll button - only for categories */}
            {showLeftButton && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}

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
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-28 sm:w-36 h-28 sm:h-36 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 group/card ${
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
                      <span className="absolute bottom-2 left-0 right-0 text-white text-sm sm:text-base font-semibold text-center px-2 leading-tight">
                        {category.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-lg mb-2 flex items-center justify-center ${
                        selectedCategoryId === category.id
                          ? 'bg-white/20'
                          : 'bg-gray-100 group-hover/card:bg-gray-200'
                      }`}>
                        <span className={`text-3xl sm:text-4xl ${
                          selectedCategoryId === category.id ? 'text-white' : 'text-gray-400'
                        }`}>
                          📦
                        </span>
                      </div>
                      <span className={`text-sm sm:text-base font-semibold text-center px-2 leading-tight ${
                        selectedCategoryId === category.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {category.name}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Right scroll button - only for categories */}
            {showRightButton && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all"
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

