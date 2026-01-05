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
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryName,
  products,
  onViewAll,
  getCartItemQuantity,
}) => {
  if (!products || products.length === 0) return null;

  // Show max 6 products per category
  const displayProducts = products.slice(0, 6);

  return (
    <div className="mb-12">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {categoryName}
        </h2>
        
        <button
          onClick={onViewAll}
          className="flex items-center gap-2 px-4 py-2 text-gray-900 hover:text-black font-medium text-sm sm:text-base transition-all group"
        >
          <span>სრულად</span>
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
        {displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            cartQuantity={getCartItemQuantity(product.id)}
            hideDescription={true}
          />
        ))}
      </div>
    </div>
  );
};

export default CategorySection;

