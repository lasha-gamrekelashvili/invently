import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, CubeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Product, ProductVariant } from '../types';
import CustomDropdown from './CustomDropdown';

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: (productId: string, variantId?: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, cartQuantity, onAddToCart }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

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

  const handleImageChange = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
    }
  };

  const currentImage = product.images?.[currentImageIndex];

  const handleProductClick = () => {
    navigate(`/product/${product.slug || product.id}`);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent product click when clicking add to cart
    onAddToCart(product.id, selectedVariant?.id);
  };

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden border border-gray-200/60 hover:border-gray-300 transition-all duration-200 cursor-pointer flex flex-col h-full"
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={currentImage.altText || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <CubeIcon className="w-16 h-16 text-gray-300" />
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
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-white/90 transition-all shadow-sm z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-white/90 transition-all shadow-sm z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Stock Badge */}
        {displayStock === 0 && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-md">
            Sold out
          </div>
        )}

        {displayStock > 0 && displayStock <= 5 && (
          <div className="absolute top-2 left-2 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-md">
            Only {displayStock} left
          </div>
        )}

        {/* Cart Quantity Badge */}
        {cartQuantity > 0 && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            {cartQuantity} in cart
          </div>
        )}

        {/* Image Indicator Dots */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
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

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        {product.category && (
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
            {product.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2">
          {product.title}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Variant indicator */}
        {priceInfo.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="mb-2">
            <span className="text-xs text-gray-500">
              {product.variants.filter(v => v.isActive).length} options available
            </span>
          </div>
        )}

        {/* Spacer to push price to bottom */}
        <div className="flex-1"></div>

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between mt-auto pt-3">
          <div>
            {priceInfo.hasVariants && !selectedVariant ? (
              <p className="text-xl font-bold text-gray-900">
                ${priceInfo.minPrice.toFixed(2)}
                {priceInfo.minPrice !== priceInfo.maxPrice && <span className="text-sm font-normal text-gray-500"> +</span>}
              </p>
            ) : (
              <p className="text-xl font-bold text-gray-900">${displayPrice.toFixed(2)}</p>
            )}
          </div>

          {/* Add to Cart Button */}
          {displayStock > 0 && !priceInfo.hasVariants && (
            <button
              onClick={handleAddToCartClick}
              className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors active:scale-95"
            >
              <ShoppingCartIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;