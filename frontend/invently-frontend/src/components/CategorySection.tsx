import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface CategorySectionProps {
  categoryName: string;
  products: Product[];
  onViewAll: () => void;
  onCategoryClick: () => void;
  getCartItemQuantity: (productId: string, variantId?: string) => number;
  cardInfoBackgroundColor?: string;
  productCardBorderColor?: string;
  productCardHoverBorderColor?: string;
  productCardTextColor?: string;
  productCardCategoryTextColor?: string;
  productCardPriceTextColor?: string;
  categorySectionTitleColor?: string;
  categorySectionAccentColor?: string;
  categorySectionLinkColor?: string;
  categorySectionLinkHoverColor?: string;
  categorySectionBorderColor?: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryName,
  products,
  onViewAll,
  getCartItemQuantity,
  cardInfoBackgroundColor,
  productCardBorderColor,
  productCardHoverBorderColor,
  productCardTextColor,
  productCardCategoryTextColor,
  productCardPriceTextColor,
  categorySectionTitleColor = '#171717',
  categorySectionAccentColor = '#171717',
  categorySectionLinkColor = '#525252',
  categorySectionLinkHoverColor = '#171717',
  categorySectionBorderColor = '#e5e5e5',
}) => {
  if (!products || products.length === 0) return null;

  // Show max 6 products per category (one line only)
  const displayProducts = products.slice(0, 6);

  return (
    <div className="mb-8 pb-8 border-b last:border-b-0" style={{ borderColor: categorySectionBorderColor }}>
      {/* Category section */}
      <div className="py-6 sm:py-8">
        <div>
          {/* Category Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 rounded-full" style={{ backgroundColor: categorySectionAccentColor }}></div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight" style={{ color: categorySectionTitleColor }}>
                {categoryName}
              </h2>
            </div>
            
            <button
              onClick={onViewAll}
              className="flex items-center gap-2 font-medium text-sm sm:text-base transition-colors group"
              style={{ color: categorySectionLinkColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = categorySectionLinkHoverColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = categorySectionLinkColor;
              }}
            >
              <span>სრულად</span>
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Products Grid - Single row, max 6 items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={getCartItemQuantity(product.id)}
              hideDescription={true}
              cardInfoBackgroundColor={cardInfoBackgroundColor}
              productCardBorderColor={productCardBorderColor}
              productCardHoverBorderColor={productCardHoverBorderColor}
              productCardTextColor={productCardTextColor}
              productCardCategoryTextColor={productCardCategoryTextColor}
              productCardPriceTextColor={productCardPriceTextColor}
            />
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySection;

