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
      const hasOverflow = scrollWidth > clientWidth;
      setShowLeftButton(hasOverflow && scrollLeft > 10);
      setShowRightButton(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Get only root categories (no parentId)
  const rootCategories = categories.filter(cat => !cat.parentId);

  useEffect(() => {
    // Initial check
    const initialTimer = setTimeout(checkScroll, 50);
    
    const container = categoriesContainerRef.current;
    if (container) {
      // Scroll event listener
      container.addEventListener('scroll', checkScroll);
      
      // Window resize listener
      window.addEventListener('resize', checkScroll);
      
      // ResizeObserver for better resize detection (including dev tools)
      const resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(container);
      
      // Check after a delay to ensure DOM is fully rendered
      const delayTimer = setTimeout(checkScroll, 200);
      
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        resizeObserver.disconnect();
        clearTimeout(initialTimer);
        clearTimeout(delayTimer);
      };
    }
    
    return () => clearTimeout(initialTimer);
  }, [categories, rootCategories.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (categoriesContainerRef.current) {
      // Responsive scroll amount based on screen width
      const isMobile = window.innerWidth < 640;
      const scrollAmount = isMobile ? 160 : 300; // Scroll ~2 cards on mobile, ~2.5 on desktop
      categoriesContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="w-full py-2 sm:py-4">
      {/* Container centered with max-width */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-4">
        {/* Flex container to center everything together - Always horizontal */}
        <div className="flex items-center justify-center">
          {/* "All Categories" button - Smaller on mobile */}
          <div className="flex-shrink-0 mr-2 sm:mr-3 md:mr-4">
            <button
              onClick={onShowAllClick}
              className="flex flex-col items-center justify-center w-[72px] sm:w-28 md:w-36 h-[88px] sm:h-36 md:h-44 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 group/card"
            >
              <Squares2X2Icon className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white mb-1 sm:mb-2" />
              <span className="text-white text-[9px] sm:text-sm md:text-base font-semibold text-center px-1 sm:px-2 leading-tight">
                ყველა კატეგორია
              </span>
            </button>
          </div>

          {/* Categories carousel with scroll buttons - Show ~2 categories on mobile with proper spacing */}
          <div className="relative max-w-[calc(100vw-130px)] sm:max-w-[calc(100vw-200px)] md:max-w-4xl">
            {/* Categories container - scrollable, centered */}
            <div
              ref={categoriesContainerRef}
              className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide py-2 sm:py-4 px-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Category cards */}
              {rootCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className={`flex-shrink-0 relative w-[72px] sm:w-28 md:w-36 h-[88px] sm:h-36 md:h-44 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 group/card overflow-hidden bg-gray-200 hover:bg-gray-300 ${
                    selectedCategoryId === category.id
                      ? 'border-2 border-black'
                      : 'border-2 border-transparent'
                  }`}
                >
                  {category.image ? (
                    <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden relative">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center" />
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] leading-[11px] sm:text-sm md:text-base font-semibold text-center px-1 sm:px-2 sm:leading-tight">
                        {category.name}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center">
                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl sm:text-4xl md:text-5xl text-gray-400">
                          📦
                        </span>
                      </div>
                      
                      {/* Text centered */}
                      <span className="relative text-[9px] leading-[11px] sm:text-sm md:text-base font-semibold text-center px-1 sm:px-2 sm:leading-tight z-10 text-gray-900">
                        {category.name}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Fade overlay on left */}
            {showLeftButton && (
              <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 md:w-28 bg-gradient-to-r from-gray-50 via-gray-50/90 via-gray-50/60 via-gray-50/30 to-transparent pointer-events-none z-10" />
            )}

            {/* Fade overlay on right */}
            {showRightButton && (
              <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 md:w-28 bg-gradient-to-l from-gray-50 via-gray-50/90 via-gray-50/60 via-gray-50/30 to-transparent pointer-events-none z-10" />
            )}

            {/* Left scroll button */}
            {showLeftButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  scroll('left');
                }}
                className="absolute left-0 sm:-left-4 md:-left-5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white shadow-xl rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-all pointer-events-auto border border-gray-200"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700" />
              </button>
            )}

            {/* Right scroll button */}
            {showRightButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  scroll('right');
                }}
                className="absolute right-0 sm:-right-4 md:-right-5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white shadow-xl rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-all pointer-events-auto border border-gray-200"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;

