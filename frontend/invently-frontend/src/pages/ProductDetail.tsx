import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '../utils/api';
import { useCart, CartProvider } from '../contexts/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import TenantNotFound from '../components/TenantNotFound';
import StorefrontLayout from '../components/StorefrontLayout';
import CustomDropdown from '../components/CustomDropdown';
import Cart from '../components/Cart';
import ProductCard from '../components/ProductCard';
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  const similarProductsRef = useRef<HTMLDivElement>(null);

  const scrollSimilarProducts = (direction: 'left' | 'right') => {
    if (similarProductsRef.current) {
      const scrollAmount = 300;
      similarProductsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

  // Helper to find category by ID recursively
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

  // Get root category ID (top-level parent)
  const getRootCategoryId = (categoryId: string | undefined): string | undefined => {
    if (!categoryId || !categories) return undefined;
    
    let currentCat = findCategoryById(categoryId, categories);
    if (!currentCat) return undefined;
    
    // Traverse up to find root
    while (currentCat?.parentId) {
      const parent = findCategoryById(currentCat.parentId, categories);
      if (parent) {
        currentCat = parent;
      } else {
        break;
      }
    }
    
    return currentCat?.id;
  };

  const rootCategoryId = getRootCategoryId(product?.category?.id);
  const rootCategory = rootCategoryId ? findCategoryById(rootCategoryId, categories) : null;

  // Fetch similar products from root category
  const { data: similarProductsData } = useQuery({
    queryKey: ['similar-products', rootCategoryId],
    queryFn: () => storefrontAPI.getProducts({ categoryId: rootCategoryId, limit: 12 }),
    enabled: !!rootCategoryId,
    retry: false,
  });

  // Filter out the current product from similar products
  const similarProducts = similarProductsData?.products?.filter(p => p.id !== product?.id) || [];

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
          <h1 className="text-2xl font-light tracking-tight text-neutral-900 mb-4">Product Not Found</h1>
          <p className="text-neutral-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-neutral-900 text-white font-medium rounded-full hover:bg-neutral-800 transition-colors"
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
  
  // Calculate the minimum price across all variants for "Starting from" display
  const minVariantPrice = hasVariants 
    ? Math.min(...activeVariants.map(v => v.price || product.price))
    : product.price;
  
  // Display price: selected variant price, or minimum variant price, or base product price
  const displayPrice = selectedVariant?.price || (hasVariants ? minVariantPrice : product.price);
  const displayStock = selectedVariant?.stockQuantity ?? product.stockQuantity;
  
  // For products with variants, only show stock status after a variant is selected
  // For simple products (no variants), show stock status immediately
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

  // Handle category selection from sidebar
  const handleCategorySelect = (categoryId: string) => {
    const path = buildCategoryPath(categoryId);
    if (path) {
      navigate(path);
    }
  };

  // Handle "All Products" click
  const handleAllProductsClick = () => {
    navigate('/');
  };

  const categoryHierarchy = buildCategoryHierarchy(product?.category?.id);
  
  // Get IDs of all categories in the hierarchy for auto-expanding sidebar
  const expandedCategoryIds = categoryHierarchy.map(cat => cat.id);

  const handleAddToCart = async () => {
    if (!isInStock) return;

    await addToCart(product.id, quantity, selectedVariant?.id);
  };

  const handleBuyNow = async () => {
    if (!isInStock) return;

    await addToCart(product.id, quantity, selectedVariant?.id);
    navigate('/checkout');
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
      selectedCategoryId={product?.category?.id}
      expandedCategoryIds={expandedCategoryIds}
      onCategorySelect={handleCategorySelect}
      onAllProductsClick={handleAllProductsClick}
      onCartClick={handleCartToggle}
      isCartOpen={showCart}
      hideSidebar={false}
    >
      <div>
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 min-h-[42px]">
            <nav className="overflow-x-auto scrollbar-hide py-2 sm:py-2.5">
              <div className="flex items-center text-xs sm:text-sm text-neutral-600 whitespace-nowrap min-w-max">
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-neutral-900 transition-colors flex-shrink-0 px-1"
                >
                  Home
                </button>
                
                {categoryHierarchy.map((cat) => (
                  <React.Fragment key={cat.id}>
                    <ChevronRightIcon className="w-3 h-3 mx-1 sm:mx-2 flex-shrink-0 text-neutral-400" />
                    <button
                      onClick={() => handleCategorySelect(cat.id)}
                      className="hover:text-neutral-900 transition-colors flex-shrink-0 px-1"
                    >
                      {cat.name}
                    </button>
                  </React.Fragment>
                ))}
                
                <ChevronRightIcon className="w-3 h-3 mx-1 sm:mx-2 flex-shrink-0 text-neutral-400" />
                <span className="text-neutral-900 font-medium flex-shrink-0 px-1">{product.title}</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Product Card */}
        <div className="rounded-2xl border border-neutral-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6" style={{ backgroundColor: storeSettings?.productDetailCardBackgroundColor || '#ffffff' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* Vertical Thumbnails - Desktop Only */}
            {product.images && product.images.length > 1 && (
              <div className="hidden lg:flex lg:col-span-1 flex-col gap-2">
                {product.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-neutral-800'
                        : 'border-neutral-200 hover:border-neutral-300'
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
            <div className={product.images && product.images.length > 1 ? "lg:col-span-5" : "lg:col-span-6"}>
              <div 
                className="aspect-square bg-neutral-50 rounded-lg overflow-hidden cursor-zoom-in border border-neutral-200"
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
                    <p className="text-neutral-400">No image available</p>
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
                          ? 'border-neutral-800'
                          : 'border-neutral-200'
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
            <div className="lg:col-span-6 space-y-3 sm:space-y-4">
              {/* Title */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-light tracking-tight text-neutral-900 break-words">{product.title}</h1>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-900">₾{displayPrice.toFixed(2)}</span>
                {hasVariants && !selectedVariant && (
                  <span className="text-xs sm:text-sm text-neutral-500">Starting from</span>
                )}
              </div>

              {/* Variants */}
              {hasVariants && (
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-2">Options:</label>
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
                <label className="text-xs sm:text-sm font-medium text-neutral-700 block mb-2">Quantity:</label>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="flex items-center border border-neutral-300 rounded-xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-2 sm:px-3 py-2 hover:bg-neutral-50 disabled:opacity-50 text-base sm:text-lg"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-3 sm:px-4 py-2 font-medium border-x border-neutral-300 min-w-[45px] sm:min-w-[50px] text-center text-sm sm:text-base">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                      disabled={quantity >= displayStock}
                      className="px-2 sm:px-3 py-2 hover:bg-neutral-50 disabled:opacity-50 text-base sm:text-lg"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-neutral-500">Max: {displayStock}</span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="py-2 sm:py-3 border-y border-neutral-100">
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-line break-words">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Cart Status */}
              {cartQuantity > 0 && (
                <div className="flex items-center gap-2 bg-neutral-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-neutral-200">
                  <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-neutral-700">
                    {cartQuantity} in cart
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 sm:space-y-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock || (hasVariants && !selectedVariant)}
                  className={`w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-4 sm:px-6 rounded-full font-medium transition-all text-xs sm:text-sm ${
                    !isInStock || (hasVariants && !selectedVariant)
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                >
                  <ShoppingCartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add to Cart
                </button>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={handleBuyNow}
                    disabled={!isInStock || (hasVariants && !selectedVariant)}
                    className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium transition-all text-xs sm:text-sm ${
                      !isInStock || (hasVariants && !selectedVariant)
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                        : 'bg-white text-neutral-900 border-2 border-neutral-800 hover:bg-neutral-100 hover:border-neutral-700'
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
                    className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all text-xs sm:text-sm"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="rounded-2xl border border-neutral-200 p-4 sm:p-6 mb-4 sm:mb-6" style={{ backgroundColor: storeSettings?.productDetailCardBackgroundColor || '#ffffff' }}>
            <h3 className="text-base sm:text-lg font-light tracking-tight text-neutral-900 mb-3 sm:mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              {Object.entries(product.attributes).map(([key, value]) => (
                <div 
                  key={key} 
                  className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 bg-neutral-50 rounded-lg gap-2"
                >
                  <span className="font-medium text-neutral-700 text-xs sm:text-sm">{key}:</span>
                  <span className="text-neutral-900 text-xs sm:text-sm text-right">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 p-4 sm:p-6" style={{ backgroundColor: storeSettings?.productDetailCardBackgroundColor || '#ffffff' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-light tracking-tight text-neutral-900">
                More from {rootCategory?.name || product.category?.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollSimilarProducts('left')}
                  className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollSimilarProducts('right')}
                  className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div 
              ref={similarProductsRef}
              className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2"
            >
              {similarProducts.map((similarProduct) => (
                <div key={similarProduct.id} className="flex-shrink-0 w-32 sm:w-40 lg:w-44">
                  <ProductCard
                    product={similarProduct}
                    cartQuantity={getCartItemQuantity(similarProduct.id)}
                    hideDescription
                  />
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
          onClose={handleCartCloseComplete}
          isClosing={cartClosing}
        />
      )}
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
