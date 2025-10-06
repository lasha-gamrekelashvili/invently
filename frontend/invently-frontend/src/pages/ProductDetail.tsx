import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '../utils/api';
import { useCart, CartProvider } from '../contexts/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import TenantNotFound from '../components/TenantNotFound';
import StorefrontLayout from '../components/StorefrontLayout';
import CustomDropdown from '../components/CustomDropdown';
import {
  ShoppingCartIcon,
  ArrowLeftIcon,
  HeartIcon,
  ShareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { Product, ProductVariant } from '../types';

const ProductDetailContent: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity } = useCart();
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAddedToCart, setShowAddedToCart] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product-detail', slug],
    queryFn: () => storefrontAPI.getProduct(slug!),
    enabled: !!slug,
    retry: false,
  });

  const { data: storeInfo } = useQuery({
    queryKey: ['store-info'],
    queryFn: () => storefrontAPI.getStoreInfo(),
    retry: false,
  });

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => storefrontAPI.getSettings(),
    retry: false,
  });

  const { data: categories } = useQuery({
    queryKey: ['storefront-categories'],
    queryFn: () => storefrontAPI.getCategories(),
    retry: false,
  });

  if (error) {
    return <TenantNotFound />;
  }

  if (isLoading) {
    return (
      <StorefrontLayout
        storeInfo={storeInfo}
        storeSettings={storeSettings}
        categories={categories}
        onCartClick={() => {}}
      >
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout
        storeInfo={storeInfo}
        storeSettings={storeSettings}
        categories={categories}
        onCartClick={() => {}}
      >
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Store
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  // Calculate price and stock info
  const activeVariants = product.variants?.filter(v => v.isActive) || [];
  const hasVariants = activeVariants.length > 0;
  
  const displayPrice = selectedVariant?.price || product.price;
  const displayStock = selectedVariant?.stockQuantity ?? product.stockQuantity;
  const isInStock = displayStock > 0;

  const cartQuantity = getCartItemQuantity(product.id, selectedVariant?.id);

  const handleAddToCart = async () => {
    if (!isInStock) return;
    
    await addToCart(product.id, quantity, selectedVariant?.id);
    setShowAddedToCart(true);
    setTimeout(() => setShowAddedToCart(false), 3000);
  };

  const handleVariantChange = (variantId: string) => {
    const variant = product.variants?.find(v => v.id === variantId);
    setSelectedVariant(variant || null);
    setQuantity(1); // Reset quantity when variant changes
  };

  const currentImage = product.images?.[currentImageIndex];

  return (
    <StorefrontLayout
      storeInfo={storeInfo}
      storeSettings={storeSettings}
      categories={categories}
      onCartClick={() => {}}
    >
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
              {currentImage ? (
                <img
                  src={currentImage.url}
                  alt={currentImage.altText || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-300 rounded-xl mx-auto mb-4"></div>
                    <p className="text-gray-500">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.altText || product.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Category */}
            {product.category && (
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                {product.category.name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
              {hasVariants && !selectedVariant && (
                <span className="text-lg text-gray-500">
                  {activeVariants.length > 1 ? 'Starting from' : 'From'}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              {isInStock ? (
                <>
                  <CheckIcon className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">
                    {displayStock} in stock
                  </span>
                </>
              ) : (
                <>
                  <XMarkIcon className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">Out of stock</span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Variant Selector */}
            {hasVariants && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Select Option:</label>
                <CustomDropdown
                  value={selectedVariant?.id || ''}
                  onChange={handleVariantChange}
                  options={[
                    { value: '', label: 'Choose variant...' },
                    ...activeVariants.map((variant) => ({
                      value: variant.id,
                      label: `${Object.entries(variant.options).map(([key, value]) => `${value}`).join(' / ')}${variant.price ? ` - $${variant.price.toFixed(2)}` : ''}${variant.stockQuantity === 0 ? ' (Out of stock)' : ''}`,
                      disabled: variant.stockQuantity === 0
                    }))
                  ]}
                  placeholder="Choose variant..."
                />
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">Quantity:</label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-white border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-4 py-3 text-lg font-semibold text-gray-900 border-x border-gray-300 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    disabled={quantity >= displayStock}
                    className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  Max: {displayStock}
                </span>
              </div>
            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              {cartQuantity > 0 && (
                <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-xl">
                  <span className="text-sm font-semibold text-green-700">
                    {cartQuantity} in cart
                  </span>
                  <CheckIcon className="w-5 h-5 text-green-600" />
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock || (hasVariants && !selectedVariant)}
                  className={`flex-1 flex items-center justify-center py-4 px-6 rounded-xl font-semibold transition-all ${
                    !isInStock || (hasVariants && !selectedVariant)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl active:scale-95'
                  }`}
                >
                  <ShoppingCartIcon className="w-5 h-5 mr-2" />
                  {!isInStock ? 'Out of Stock' : hasVariants && !selectedVariant ? 'Select Variant' : 'Add to Cart'}
                </button>

                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-4 rounded-xl transition-all ${
                    isWishlisted
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isWishlisted ? (
                    <HeartSolidIcon className="w-6 h-6" />
                  ) : (
                    <HeartIcon className="w-6 h-6" />
                  )}
                </button>

                <button className="p-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                  <ShareIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Added to Cart Notification */}
              {showAddedToCart && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-slide-in">
                  <CheckIcon className="w-5 h-5" />
                  <span>Added to cart!</span>
                </div>
              )}
            </div>

            {/* Product Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700 capitalize">{key}:</span>
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
};

const ProductDetail: React.FC = () => {
  return (
    <CartProvider>
      <ProductDetailContent />
    </CartProvider>
  );
};

export default ProductDetail;
