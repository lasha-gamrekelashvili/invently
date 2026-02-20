import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { storefrontAPI } from '../utils/api';
import TenantNotFound from '../components/TenantNotFound';
import StorefrontLayout from '../components/StorefrontLayout';
import StorefrontPagination from '../components/StorefrontPagination';
import ProductCard from '../components/ProductCard';
import CategorySection from '../components/CategorySection';
import CategorySectionSkeleton from '../components/CategorySectionSkeleton';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import Cart from '../components/Cart';
import { CartProvider, useCart } from '../contexts/CartContext';
import { CubeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const StorefrontContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCart, setShowCart] = useState(false);
  const [cartClosing, setCartClosing] = useState(false);
  const [searchInput, setSearchInput] = useState(''); // User's input
  const [searchQuery, setSearchQuery] = useState(''); // Debounced search query
  const [currentPage, setCurrentPage] = useState(1);
  const [priceInput, setPriceInput] = useState({ min: '', max: '' }); // User's input
  const [priceRange, setPriceRange] = useState({ min: '', max: '' }); // Debounced price range
  const [gridLayout, setGridLayout] = useState(3); // Default to 3 items per row
  const pageSize = 12; // Products per page
  const { getCartItemQuantity } = useCart();

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

  // Parse category slug from URL
  const getCategorySlugFromUrl = () => {
    const path = location.pathname;
    if (path.startsWith('/category/')) {
      // Get the last slug in the path (supports nested categories)
      const slugs = path.replace('/category/', '').split('/').filter(Boolean);
      // URL-decode the slug to handle special characters
      return slugs.length > 0 ? decodeURIComponent(slugs[slugs.length - 1]) : null;
    }
    return null;
  };

  const categorySlugFromUrl = getCategorySlugFromUrl();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounce price range input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPriceRange(priceInput);
      setCurrentPage(1); // Reset to first page when price range changes
    }, 800); // 800ms delay

    return () => clearTimeout(timer);
  }, [priceInput]);

  const { data: storeInfo, error: storeInfoError, isLoading: storeInfoLoading } = useQuery({
    queryKey: ['store-info'],
    queryFn: () => storefrontAPI.getStoreInfo(),
    retry: false,
  });

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => storefrontAPI.getSettings(),
    retry: false,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['storefront-categories'],
    queryFn: () => storefrontAPI.getCategories(),
    retry: false,
  });

  // Find category by slug from URL
  const findCategoryBySlug = (slug: string | null, categoriesList: any[] = []): any => {
    if (!slug || !categoriesList) return null;

    for (const category of categoriesList) {
      if (category.slug === slug) return category;
      if (category.children?.length > 0) {
        const found = findCategoryBySlug(slug, category.children);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedCategory = findCategoryBySlug(categorySlugFromUrl, categories);
  const selectedCategoryId = selectedCategory?.id;

  // Get root categories (no parent)
  const rootCategories = React.useMemo(() => {
    if (!categories) return [];
    return categories.filter((cat: any) => !cat.parentId);
  }, [categories]);

  // For home page (no category selected), fetch products for each root category
  const categoryProductsQueries = useQuery({
    queryKey: ['category-products', rootCategories.map((c: any) => c.id), priceRange],
    queryFn: async () => {
      if (selectedCategoryId || searchQuery) return null; // Only fetch on home page
      
      const results = await Promise.all(
        rootCategories.map(async (category: any) => {
          const data = await storefrontAPI.getProducts({
            categoryId: category.id,
            page: 1,
            limit: 6, // Get 6 products per category (one line only)
            minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
            maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined,
          });
          return {
            categoryId: category.id,
            categoryName: category.name,
            products: data.products || [],
          };
        })
      );
      return results;
    },
    enabled: !selectedCategoryId && !searchQuery && rootCategories.length > 0,
    retry: false,
  });

  // Check if we're in initial loading state
  const isInitialLoading = storeInfoLoading || categoriesLoading || 
    (!categories && !storeInfoError) ||
    (categoryProductsQueries.isLoading && !selectedCategoryId && !searchQuery);

  // For filtered views (category selected or search), use the existing products query
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['storefront-products', selectedCategoryId, searchQuery, currentPage, pageSize, priceRange],
    queryFn: () => storefrontAPI.getProducts({
      categoryId: selectedCategoryId,
      search: searchQuery || undefined,
      page: currentPage,
      limit: pageSize,
      minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
      maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined,
    }),
    enabled: !!(selectedCategoryId || searchQuery),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  // Get price range for all products in current category/filter combination (without price filter)
  const { data: priceRangeData, isLoading: priceRangeDataLoading } = useQuery({
    queryKey: ['storefront-price-range', selectedCategoryId, searchQuery],
    queryFn: () => storefrontAPI.getProducts({
      categoryId: selectedCategoryId,
      search: searchQuery || undefined,
      page: 1,
      limit: 1000, // Get all products to find price range
    }),
    retry: false,
    // Always fetch to get price range for current context
  });

  // Check if price range is loading
  const isPriceRangeLoading = isInitialLoading || (priceRangeDataLoading && !priceRangeData);

  // Calculate max price from all products in current category/filter
  const maxPrice = React.useMemo(() => {
    if (!priceRangeData?.products?.length) return 1000; // Default fallback
    const calculatedMax = Math.ceil(Math.max(...priceRangeData.products.map((p: any) => p.price || 0)));
    return calculatedMax;
  }, [priceRangeData, selectedCategoryId, searchQuery]);

  const displayCategories = categories;
  const displayProducts = productsData || { products: [], pagination: null };

  if (storeInfoError) {
    return <TenantNotFound />;
  }

  const pageTitle = selectedCategory
    ? `${selectedCategory.name} | ${storeInfo?.name || ''}`
    : storeInfo?.name || '';
  const pageDescription = selectedCategory
    ? `Browse ${selectedCategory.name} at ${storeInfo?.name}`
    : storeInfo?.description || `Shop at ${storeInfo?.name}`;
  const canonicalUrl = window.location.origin + location.pathname;

  const organizationLd = storeInfo ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: storeInfo.name,
    url: window.location.origin,
    ...(storeInfo.description && { description: storeInfo.description }),
  } : null;

  // Build category URL path (including parents)
  const buildCategoryPath = (categoryId: string, categoriesList: any[] = []): string => {
    const category = findCategoryById(categoryId, categoriesList);
    if (!category) return '';

    const slugs: string[] = [];
    let current = category;

    // Build path from bottom to top
    while (current) {
      // URL-encode each slug to handle special characters
      slugs.unshift(encodeURIComponent(current.slug));
      if (current.parentId) {
        current = findCategoryById(current.parentId, categoriesList);
      } else {
        break;
      }
    }

    return '/category/' + slugs.join('/');
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

  const categoryHierarchy = buildCategoryHierarchy(selectedCategoryId);
  
  // Get IDs of all categories in the hierarchy for auto-expanding sidebar
  const expandedCategoryIds = categoryHierarchy.map((cat: any) => cat.id);

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === selectedCategoryId) {
      // If clicking the same category, go to all products
      navigate('/');
    } else {
      // Navigate to category URL
      const path = buildCategoryPath(categoryId, categories);
      navigate(path);
    }
    setCurrentPage(1); // Reset to first page when changing category
    // Clear price filter when switching categories
    setPriceInput({ min: '', max: '' });
    setPriceRange({ min: '', max: '' });
  };

  const handleAllProductsClick = () => {
    navigate('/');
    setCurrentPage(1); // Reset to first page
    // Clear price filter when going to all products
    setPriceInput({ min: '', max: '' });
    setPriceRange({ min: '', max: '' });
  };


  const handleSearchChange = (query: string) => {
    setSearchInput(query); // Update input immediately, debounce will handle the actual search
  };

  const handlePriceRangeChange = (min: string, max: string) => {
    setPriceInput({ min, max }); // Update input immediately (no lag in UI)
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of products section
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGridLayoutChange = (layout: number) => {
    setGridLayout(layout);
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content={storeInfo?.name || ''} />
        {organizationLd && (
          <script type="application/ld+json">{JSON.stringify(organizationLd)}</script>
        )}
      </Helmet>
    <StorefrontLayout
      storeInfo={storeInfo}
      storeSettings={storeSettings}
      categories={displayCategories}
      categoriesLoading={categoriesLoading}
      selectedCategoryId={selectedCategoryId}
      expandedCategoryIds={expandedCategoryIds}
      onCategorySelect={handleCategorySelect}
      onAllProductsClick={handleAllProductsClick}
      onCartClick={handleCartToggle}
      onSearchChange={handleSearchChange}
      onPriceRangeChange={handlePriceRangeChange}
      priceRange={priceInput}
      maxPrice={maxPrice}
      priceRangeLoading={isPriceRangeLoading}
      searchQuery={searchInput}
      isCartOpen={showCart}
      hideSidebar={false}
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Products Section */}
        <div id="products-section">
          {/* Show skeleton loaders during initial page load */}
          {isInitialLoading ? (
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <CategorySectionSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
          {/* Category Breadcrumb & Grid Controls */}
          {selectedCategory && (
            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                {/* Breadcrumb */}
                <nav className="overflow-x-auto scrollbar-hide">
                  <div className="flex items-center text-xs sm:text-sm whitespace-nowrap min-w-max" style={{ color: storeSettings?.breadcrumbTextColor || '#525252' }}>
                    <button
                      onClick={handleAllProductsClick}
                      className="transition-colors flex-shrink-0 px-1"
                      style={{ color: storeSettings?.breadcrumbTextColor || '#525252' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = storeSettings?.breadcrumbHoverColor || '#171717';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = storeSettings?.breadcrumbTextColor || '#525252';
                      }}
                    >
                      Home
                    </button>
                    
                    {categoryHierarchy.map((cat, index) => (
                      <React.Fragment key={cat.id}>
                        <ChevronRightIcon className="w-3 h-3 mx-1 sm:mx-2 flex-shrink-0" style={{ color: storeSettings?.breadcrumbIconColor || '#a3a3a3' }} />
                        <button
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`transition-colors flex-shrink-0 px-1 ${
                            index === categoryHierarchy.length - 1 ? 'font-medium' : ''
                          }`}
                          style={{
                            color: index === categoryHierarchy.length - 1
                              ? (storeSettings?.breadcrumbActiveTextColor || '#171717')
                              : (storeSettings?.breadcrumbTextColor || '#525252')
                          }}
                          onMouseEnter={(e) => {
                            if (index !== categoryHierarchy.length - 1) {
                              e.currentTarget.style.color = storeSettings?.breadcrumbHoverColor || '#171717';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (index !== categoryHierarchy.length - 1) {
                              e.currentTarget.style.color = storeSettings?.breadcrumbTextColor || '#525252';
                            }
                          }}
                        >
                          {cat.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </nav>

                {/* Grid Layout Controls - Available on all screen sizes */}
                <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs sm:text-sm px-1" style={{ color: storeSettings?.breadcrumbTextColor || '#525252' }}>View:</span>
                {/* 2 columns */}
                <button
                  onClick={() => handleGridLayoutChange(2)}
                  className={`group relative p-2 sm:p-2.5 rounded-md border transition-all ${
                    gridLayout === 2
                      ? 'border-neutral-800 bg-neutral-100'
                      : 'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                  title="2 columns"
                >
                  <div className="flex gap-0.5 sm:gap-1">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1.5 sm:w-2 h-4 sm:h-5 rounded-sm transition-colors ${
                          gridLayout === 2
                            ? 'bg-neutral-800'
                            : 'bg-neutral-400 group-hover:bg-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                </button>

                {/* 3 columns */}
                <button
                  onClick={() => handleGridLayoutChange(3)}
                  className={`group relative p-2 sm:p-2.5 rounded-md border transition-all ${
                    gridLayout === 3
                      ? 'border-neutral-800 bg-neutral-100'
                      : 'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                  title="3 columns"
                >
                  <div className="flex gap-0.5 sm:gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1 sm:w-1.5 h-4 sm:h-5 rounded-sm transition-colors ${
                          gridLayout === 3
                            ? 'bg-neutral-800'
                            : 'bg-neutral-400 group-hover:bg-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                </button>

                {/* 4 columns */}
                <button
                  onClick={() => handleGridLayoutChange(4)}
                  className={`group relative p-2 sm:p-2.5 rounded-md border transition-all ${
                    gridLayout === 4
                      ? 'border-neutral-800 bg-neutral-100'
                      : 'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                  title="4 columns"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1 sm:w-1.5 h-4 sm:h-5 rounded-sm transition-colors ${
                          gridLayout === 4
                            ? 'bg-neutral-800'
                            : 'bg-neutral-400 group-hover:bg-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                </button>
              </div>
              </div>
            </div>
          )}

          {/* Show category sections on home page */}
          {!selectedCategoryId && !searchQuery ? (
            categoryProductsQueries.isLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CategorySectionSkeleton key={i} />
                ))}
              </div>
            ) : categoryProductsQueries.data && categoryProductsQueries.data.length > 0 ? (
              <div className="space-y-6">
                {categoryProductsQueries.data
                  .filter((cat: any) => cat.products.length > 0)
                  .map((categoryData: any) => (
                    <CategorySection
                      key={categoryData.categoryId}
                      categoryName={categoryData.categoryName}
                      products={categoryData.products}
                      onViewAll={() => handleCategorySelect(categoryData.categoryId)}
                      onCategoryClick={() => handleCategorySelect(categoryData.categoryId)}
                      getCartItemQuantity={getCartItemQuantity}
                      cardInfoBackgroundColor={storeSettings?.cardInfoBackgroundColor}
                      productCardBorderColor={storeSettings?.productCardBorderColor}
                      productCardHoverBorderColor={storeSettings?.productCardHoverBorderColor}
                      productCardTextColor={storeSettings?.productCardTextColor}
                      productCardCategoryTextColor={storeSettings?.productCardCategoryTextColor}
                      productCardPriceTextColor={storeSettings?.productCardPriceTextColor}
                      categorySectionTitleColor={storeSettings?.categorySectionTitleColor}
                      categorySectionAccentColor={storeSettings?.categorySectionAccentColor}
                      categorySectionLinkColor={storeSettings?.categorySectionLinkColor}
                      categorySectionLinkHoverColor={storeSettings?.categorySectionLinkHoverColor}
                      categorySectionBorderColor={storeSettings?.categorySectionBorderColor}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-20 px-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-6">
                  <CubeIcon className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-light tracking-tight text-neutral-900 mb-3">
                  No products available
                </h3>
                <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
                  {priceRange.min || priceRange.max
                    ? 'No products found in this price range. Try adjusting the price filter.'
                    : 'Check back later for new products!'
                  }
                </p>
                {(priceRange.min || priceRange.max) && (
                  <button
                    onClick={() => {
                      setPriceInput({ min: '', max: '' });
                      setPriceRange({ min: '', max: '' });
                    }}
                    className="mt-6 text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors underline underline-offset-4"
                  >
                    Clear price filter
                  </button>
                )}
              </div>
            )
          ) : (
            /* Filtered view - show products in grid */
            productsLoading ? (
              <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${
                gridLayout === 2 
                  ? 'grid-cols-2' 
                  : gridLayout === 3 
                  ? 'grid-cols-3' 
                  : 'grid-cols-4'
              }`}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : displayProducts?.products?.length ? (
              <>
                {/* Filtered products */}
                <div className="py-6 sm:py-8">
                  <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${
                    gridLayout === 2 
                      ? 'grid-cols-2' 
                      : gridLayout === 3 
                      ? 'grid-cols-3' 
                      : 'grid-cols-4'
                  }`}>
                    {displayProducts.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        cartQuantity={getCartItemQuantity(product.id)}
                        cardInfoBackgroundColor={storeSettings?.cardInfoBackgroundColor}
                        productCardBorderColor={storeSettings?.productCardBorderColor}
                        productCardHoverBorderColor={storeSettings?.productCardHoverBorderColor}
                        productCardTextColor={storeSettings?.productCardTextColor}
                        productCardCategoryTextColor={storeSettings?.productCardCategoryTextColor}
                        productCardPriceTextColor={storeSettings?.productCardPriceTextColor}
                      />
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {displayProducts.pagination && (
                  <StorefrontPagination
                    currentPage={displayProducts.pagination.page}
                    totalPages={displayProducts.pagination.pages}
                    totalItems={displayProducts.pagination.total}
                    itemsPerPage={displayProducts.pagination.limit}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-20 px-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-6">
                  <CubeIcon className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-light tracking-tight text-neutral-900 mb-3">
                  {selectedCategory ? `No products found in ${selectedCategory.name}` : 'No products found'}
                </h3>
                <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
                  {selectedCategory
                    ? 'Try selecting a different category or browse all products.'
                    : searchQuery
                    ? `No products match your search for "${searchQuery}"`
                    : priceRange.min || priceRange.max
                    ? 'No products found in this price range. Try adjusting the price filter.'
                    : 'Check back later for new products!'
                  }
                </p>
                {(selectedCategory || searchQuery || priceRange.min || priceRange.max) && (
                  <button
                    onClick={() => {
                      navigate('/');
                      setSearchInput('');
                      setSearchQuery('');
                      setPriceInput({ min: '', max: '' });
                      setPriceRange({ min: '', max: '' });
                      setCurrentPage(1);
                    }}
                    className="mt-6 text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors underline underline-offset-4"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )
          )}
            </>
          )}
        </div>
      </div>

      {/* Cart */}
      {showCart && (
        <Cart
          onClose={handleCartCloseComplete}
          isClosing={cartClosing}
        />
      )}
    </StorefrontLayout>
    </>
  );
};

const Storefront = () => {
  return (
    <CartProvider>
      <StorefrontContent />
    </CartProvider>
  );
};

export default Storefront;