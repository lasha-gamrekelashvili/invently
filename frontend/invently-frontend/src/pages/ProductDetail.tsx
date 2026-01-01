import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '../utils/api';
import { useCart, CartProvider } from '../contexts/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import TenantNotFound from '../components/TenantNotFound';
import StorefrontLayout from '../components/StorefrontLayout';
import CustomDropdown from '../components/CustomDropdown';
import Cart from '../components/Cart';
import Checkout from '../components/Checkout';
import {
  ShoppingCartIcon,
  CheckIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import type { ProductVariant } from '../types';

const ProductDetailContent: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemQuantity } = useCart();
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [cartClosing, setCartClosing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
        onCartClick={() => {
          if (showCart && !cartClosing) {
            setCartClosing(true);
          } else if (!showCart) {
            setShowCart(true);
            setCartClosing(false);
          }
        }}
        isCartOpen={showCart}
        hideSidebar={true}
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
        onCartClick={() => {
          if (showCart && !cartClosing) {
            setCartClosing(true);
          } else if (!showCart) {
            setShowCart(true);
            setCartClosing(false);
          }
        }}
        isCartOpen={showCart}
        hideSidebar={true}
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

  // Handle cart toggle with animation
  const handleCartToggle = () => {
    if (showCart && !cartClosing) {
      // Start close animation
      setCartClosing(true);
    } else if (!showCart) {
      // Open cart
      setShowCart(true);
      setCartClosing(false);
    }
  };

  const handleCartCloseComplete = () => {
    setShowCart(false);
    setCartClosing(false);
  };

  // Build category hierarchy (from root to current category)
  const buildCategoryHierarchy = (categoryId: string | undefined): any[] => {
    if (!categoryId || !categories) return [];
    
    const hierarchy: any[] = [];
    let currentCat = findCategoryById(categoryId, categories);
    
    while (currentCat) {
      hierarchy.unshift(currentCat);
      if (currentCat.parentId) {
        currentCat = findCategoryById(currentCat.parentId, categories);
      } else {
        break;
      }
    }
    
    return hierarchy;
  };

  const findCategoryById = (id: string, categoriesList: any[] = []): any => {
    for (const category of categoriesList) {
      if (category.id === id) return category;
      if (category.children?.length > 0) {
        const found = findCategoryById(id, category.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Build category URL path (including parents)
  const buildCategoryPath = (categoryId: string): string => {
    const category = findCategoryById(categoryId, categories);
    if (!category) return '';

    const slugs: string[] = [];
    let current = category;

    // Build path from bottom to top
    while (current) {
      slugs.unshift(current.slug);
      if (current.parentId) {
        current = findCategoryById(current.parentId, categories);
      } else {
        break;
      }
    }

    return '/category/' + slugs.join('/');
  };

  const categoryHierarchy = buildCategoryHierarchy(product?.category?.id);

  const handleAddToCart = async () => {
    if (!isInStock) return;

    await addToCart(product.id, quantity, selectedVariant?.id);
  };

  const handleVariantChange = (variantId: string) => {
    const variant = product.variants?.find(v => v.id === variantId);
    setSelectedVariant(variant || null);
    setQuantity(1); // Reset quantity when variant changes
  };

  const currentImage = product.images?.[currentImageIndex];

  return (
    <>
      <StorefrontLayout
      storeInfo={storeInfo}
      storeSettings={storeSettings}
      categories={categories}
      onCartClick={handleCartToggle}
      isCartOpen={showCart}
      hideSidebar={true}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 overflow-x-auto">
          <div className="flex items-center text-sm text-gray-600 min-w-max">
            <button
              onClick={() => navigate('/')}
              className="hover:text-gray-900 transition-colors flex-shrink-0"
            >
              Home
            </button>
            
            {categoryHierarchy.map((cat) => (
              <React.Fragment key={cat.id}>
                <ChevronRightIcon className="w-3 h-3 mx-2 flex-shrink-0 text-gray-400" />
                <button
                  onClick={() => {
                    const path = buildCategoryPath(cat.id);
                    navigate(path);
                  }}
                  className="hover:text-gray-900 transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </button>
              </React.Fragment>
            ))}
            
            <ChevronRightIcon className="w-3 h-3 mx-2 flex-shrink-0 text-gray-400" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
          </div>
        </nav>

        {/* Main Product Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Vertical Thumbnails - Desktop Only */}
            {product.images && product.images.length > 1 && (
              <div className="hidden lg:flex lg:col-span-1 flex-col gap-2">
                {product.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-blue-500'
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

            {/* Main Image */}
            <div className="lg:col-span-5">
              <div 
                className="aspect-square bg-gray-50 rounded-lg overflow-hidden cursor-zoom-in border border-gray-200"
                onClick={() => setLightboxOpen(true)}
              >
                {currentImage ? (
                  <img
                    src={currentImage.url}
                    alt={currentImage.altText || product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-400">No image available</p>
                  </div>
                )}
              </div>

              {/* Mobile Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex lg:hidden gap-2 mt-4 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                        index === currentImageIndex
                          ? 'border-blue-500'
                          : 'border-gray-200'
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

            {/* Product Info */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.title}</h1>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">₾{displayPrice.toFixed(2)}</span>
                {hasVariants && !selectedVariant && (
                  <span className="text-sm text-gray-500">Starting from</span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-sm">
                {isInStock ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-semibold text-green-700">In Stock ({displayStock} available)</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="font-semibold text-red-700">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Variants */}
              {hasVariants && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Options:</label>
                  <CustomDropdown
                    value={selectedVariant?.id || ''}
                    onChange={handleVariantChange}
                    options={[
                      { value: '', label: 'Choose variant...' },
                      ...activeVariants.map((variant) => ({
                        value: variant.id,
                        label: `${Object.entries(variant.options).map(([, value]) => `${value}`).join(' / ')}${variant.price ? ` - ₾${variant.price.toFixed(2)}` : ''}`,
                        disabled: variant.stockQuantity === 0
                      }))
                    ]}
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Quantity:</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 font-semibold border-x border-gray-300 min-w-[50px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                      disabled={quantity >= displayStock}
                      className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">Max: {displayStock}</span>
                </div>
              </div>

              {/* Cart Status */}
              {cartQuantity > 0 && (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                  <CheckIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {cartQuantity} in cart
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock || (hasVariants && !selectedVariant)}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-all ${
                    !isInStock || (hasVariants && !selectedVariant)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  Add to Cart
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock || (hasVariants && !selectedVariant)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      !isInStock || (hasVariants && !selectedVariant)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Buy Now
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: product.title,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                    className="py-3 px-4 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {product.description && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* Specifications */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(product.attributes).map(([key, value]) => (
                <div 
                  key={key} 
                  className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-semibold text-gray-700">{key}:</span>
                  <span className="text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </StorefrontLayout>

      {/* Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          {/* Navigation arrows */}
          {product.images && product.images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white/80 hover:text-white p-2 z-10 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev - 1 + product.images!.length) % product.images!.length);
                }}
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
              <button
                className="absolute right-4 text-white/80 hover:text-white p-2 z-10 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
                }}
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={currentImage.url}
            alt={currentImage.altText || product.title}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Indicators */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart */}
      {showCart && (
        <Cart
          onCheckout={() => {
            setShowCart(false);
            setCartClosing(false);
            setShowCheckout(true);
          }}
          onClose={handleCartCloseComplete}
          isClosing={cartClosing}
        />
      )}

      {/* Checkout Modal */}
      <Checkout
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </>
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
