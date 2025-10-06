import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, CubeIcon } from '@heroicons/react/24/outline';
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
      className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-2 cursor-pointer"
      onMouseEnter={handleImageChange}
      onMouseLeave={() => setCurrentImageIndex(0)}
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={currentImage.altText || product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <CubeIcon className="w-20 h-20 text-gray-300" />
          </div>
        )}

        {/* Stock Badge */}
        {displayStock === 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            Out of Stock
          </div>
        )}

        {displayStock > 0 && displayStock <= 5 && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            Only {displayStock} left
          </div>
        )}

        {/* Image Indicator Dots */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5 space-y-3">
        {/* Category */}
        {product.category && (
          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            {product.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
          {product.title}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {product.description}
          </p>
        )}

        {/* Variant Selector */}
        {priceInfo.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Select Option:</label>
            <div onClick={(e) => e.stopPropagation()}>
              <CustomDropdown
                value={selectedVariant?.id || ''}
                onChange={(value) => {
                  const variant = product.variants?.find(v => v.id === value);
                  setSelectedVariant(variant || null);
                }}
                options={[
                  { value: '', label: 'Choose variant...' },
                  ...product.variants
                    .filter(v => v.isActive)
                    .map((variant) => ({
                      value: variant.id,
                      label: `${Object.entries(variant.options).map(([key, value]) => `${value}`).join(' / ')}${variant.price ? ` - $${variant.price.toFixed(2)}` : ''}${variant.stockQuantity === 0 ? ' (Out of stock)' : ''}`,
                      disabled: variant.stockQuantity === 0
                    }))
                ]}
                placeholder="Choose variant..."
                size="compact"
              />
            </div>
          </div>
        )}

        {/* Price and Stock */}
        <div className="flex items-end justify-between pt-2 border-t border-gray-100">
          <div>
            {priceInfo.hasVariants && !selectedVariant ? (
              <>
                <p className="text-2xl font-bold text-gray-900">
                  ${priceInfo.minPrice.toFixed(2)}
                  {priceInfo.minPrice !== priceInfo.maxPrice && ` - $${priceInfo.maxPrice.toFixed(2)}`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{priceInfo.totalStock} total in stock</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">${displayPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{displayStock} in stock</p>
              </>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="pt-3">
          {cartQuantity > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-green-50 px-4 py-2.5 rounded-xl">
                <span className="text-sm font-semibold text-green-700">
                  {cartQuantity} in cart
                </span>
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <button
                onClick={handleAddToCartClick}
                disabled={priceInfo.hasVariants && !selectedVariant}
                className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-700 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add More
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCartClick}
              disabled={displayStock === 0 || (priceInfo.hasVariants && !selectedVariant)}
              className={`w-full flex items-center justify-center font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-lg active:scale-95 ${
                displayStock === 0 || (priceInfo.hasVariants && !selectedVariant)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              {displayStock === 0 ? 'Out of Stock' : priceInfo.hasVariants && !selectedVariant ? 'Select Variant' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;