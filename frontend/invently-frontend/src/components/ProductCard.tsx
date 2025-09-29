import React, { useState } from 'react';
import { ShoppingCartIcon, CubeIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    stockQuantity: number;
    images?: Array<{ url: string; altText?: string }>;
    category?: { name: string };
  };
  cartQuantity: number;
  onAddToCart: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, cartQuantity, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Simulate ratings (in real app, this would come from backend)
  const rating = 4.5;
  const reviewCount = Math.floor(Math.random() * 100) + 10;

  const handleImageChange = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
    }
  };

  const currentImage = product.images?.[currentImageIndex];

  return (
    <div
      className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-2"
      onMouseEnter={() => {
        setIsHovered(true);
        handleImageChange();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
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
        {product.stockQuantity === 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            Out of Stock
          </div>
        )}

        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            Only {product.stockQuantity} left
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
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-snug min-h-[3.5rem]">
          {product.title}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {product.description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating)
                    ? 'text-yellow-400'
                    : i < rating
                    ? 'text-yellow-400 opacity-50'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {rating} ({reviewCount})
          </span>
        </div>

        {/* Price and Stock */}
        <div className="flex items-end justify-between pt-2 border-t border-gray-100">
          <div>
            <p className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{product.stockQuantity} in stock</p>
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
                onClick={() => onAddToCart(product.id)}
                className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-700 transition-all hover:shadow-lg active:scale-95"
              >
                Add More
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product.id)}
              disabled={product.stockQuantity === 0}
              className={`w-full flex items-center justify-center font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-lg active:scale-95 ${
                product.stockQuantity === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;