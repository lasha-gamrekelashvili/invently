import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CubeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Product, ProductVariant } from '../types';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, cartQuantity }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant] = useState<ProductVariant | null>(null);

  // Calculate price range and stock for products with variants
  const priceInfo = useMemo(() => {
    const activeVariants = product.variants?.filter(v => v.isActive) || [];

    if (activeVariants.length === 0) {
      return {
        minPrice: product.price,
        maxPrice: product.price,
        totalStock: product.stockQuantity,
        hasVariants: false
      };
    }

    const prices = activeVariants.map(v => v.price || product.price);
    const totalStock = activeVariants.reduce((sum, v) => sum + v.stockQuantity, 0);

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalStock,
      hasVariants: true
    };
  }, [product]);

  const displayPrice = selectedVariant?.price || product.price;
  const displayStock = selectedVariant?.stockQuantity ?? priceInfo.totalStock;


  const currentImage = product.images?.[currentImageIndex];

  const handleProductClick = () => {
    navigate(`/product/${product.slug || product.id}`);
  };


  return (
    <div
      className="group bg-gray-100 rounded-xl overflow-hidden border border-gray-200/60 hover:border-gray-300 transition-all duration-200 cursor-pointer flex flex-col h-full"
      onClick={handleProductClick}
    >
      {/* Product Image with Overlay Text */}
      <div className="relative aspect-[3/4] bg-gray-200 overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={currentImage.altText || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <CubeIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Gradient Overlay for Text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90"></div>

        {/* Navigation Arrows */}
        {product.images && product.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + product.images!.length) % product.images!.length);
              }}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-white/90 transition-all shadow-sm z-20 opacity-0 group-hover:opacity-100 pointer-events-auto"
            >
              <ChevronLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
              }}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-white/90 transition-all shadow-sm z-20 opacity-0 group-hover:opacity-100 pointer-events-auto"
            >
              <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </>
        )}

        {/* Stock Badge */}
        {displayStock === 0 && (
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md z-10">
            Sold out
          </div>
        )}

        {displayStock > 0 && displayStock <= 5 && (
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md z-10">
            Only {displayStock} left
          </div>
        )}

        {/* Cart Quantity Badge */}
        {cartQuantity > 0 && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-green-600 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-sm z-10">
            {cartQuantity} in cart
          </div>
        )}

        {/* Product Details Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 md:p-4 z-10">
          {/* Category */}
          {product.category && (
            <span className="text-[10px] sm:text-xs text-white/90 font-medium uppercase tracking-wide mb-0.5 sm:mb-1 block">
              {product.category.name}
            </span>
          )}

          {/* Title */}
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white line-clamp-2 mb-1 sm:mb-1.5 md:mb-2">
            {product.title}
          </h3>

          {/* Description - Hide on very small cards */}
          {product.description && (
            <p className="hidden md:block text-sm text-white/80 line-clamp-1 mb-2">
              {product.description}
            </p>
          )}

          {/* Variant indicator - Hide on very small cards */}
          {priceInfo.hasVariants && product.variants && product.variants.length > 0 && (
            <div className="mb-1 sm:mb-1.5 md:mb-2">
              <span className="text-[10px] sm:text-xs text-white/70">
                {product.variants.filter(v => v.isActive).length} options
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              {priceInfo.hasVariants && !selectedVariant ? (
                <p className="text-sm sm:text-base md:text-xl font-bold text-white">
                  ${priceInfo.minPrice.toFixed(2)}
                  {priceInfo.minPrice !== priceInfo.maxPrice && <span className="text-xs sm:text-sm font-normal text-white/70"> +</span>}
                </p>
              ) : (
                <p className="text-sm sm:text-base md:text-xl font-bold text-white">${displayPrice.toFixed(2)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Image Indicator Dots */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-4' : 'bg-white/60 w-1'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;