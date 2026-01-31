import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CubeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Product, ProductVariant } from '../types';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  hideDescription?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, cartQuantity, hideDescription = false }) => {
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


  const currentImage = product.images?.[currentImageIndex];

  const handleProductClick = () => {
    navigate(`/product/${product.slug || product.id}`);
  };


  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-neutral-50 overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={currentImage.altText || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <CubeIcon className="w-16 h-16 text-neutral-300" />
          </div>
        )}

        {/* Navigation Arrows */}
        {product.images && product.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + product.images!.length) % product.images!.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm text-neutral-700 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md z-20 opacity-0 group-hover:opacity-100 pointer-events-auto"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm text-neutral-700 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md z-20 opacity-0 group-hover:opacity-100 pointer-events-auto"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Cart Quantity Badge */}
        {cartQuantity > 0 && (
          <div className="absolute top-3 right-3 bg-neutral-900 text-white text-xs font-medium px-2.5 py-1 rounded-full z-10 shadow-sm">
            {cartQuantity} in cart
          </div>
        )}

        {/* Image Indicator Dots */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        {product.category && (
          <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1.5">
            {product.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-sm sm:text-base font-medium text-neutral-900 line-clamp-2 mb-2 leading-snug">
          {product.title}
        </h3>

        {/* Description - Show on desktop when cards are large enough, unless explicitly hidden */}
        {!hideDescription && product.description && (
          <p className="hidden md:block text-sm text-neutral-600 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Variant indicator */}
        {priceInfo.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="mb-2">
            <span className="text-xs text-neutral-500">
              {product.variants.filter(v => v.isActive).length} options
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-2">
          {priceInfo.hasVariants && !selectedVariant ? (
            <p className="text-lg sm:text-xl font-light tracking-tight text-neutral-900">
              ${priceInfo.minPrice.toFixed(2)}
              {priceInfo.minPrice !== priceInfo.maxPrice && <span className="text-sm font-normal text-neutral-500"> +</span>}
            </p>
          ) : (
            <p className="text-lg sm:text-xl font-light tracking-tight text-neutral-900">${displayPrice.toFixed(2)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;