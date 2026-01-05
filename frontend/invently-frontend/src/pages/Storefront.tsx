import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TenantNotFound from '../components/TenantNotFound';
import StorefrontLayout from '../components/StorefrontLayout';
import StorefrontPagination from '../components/StorefrontPagination';
import ProductCard from '../components/ProductCard';
import CategorySection from '../components/CategorySection';
import Cart from '../components/Cart';
import Checkout from '../components/Checkout';
import { CartProvider, useCart } from '../contexts/CartContext';
import { CubeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const StorefrontContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCheckout, setShowCheckout] = useState(false);
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
      return slugs[slugs.length - 1]; // Return the deepest category slug
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

  const { data: storeInfo, error: storeInfoError } = useQuery({
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
            limit: 6, // Get 6 products per category
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
  const { data: priceRangeData } = useQuery({
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

  // Calculate max price from all products in current category/filter
  const maxPrice = React.useMemo(() => {
    if (!priceRangeData?.products?.length) return 1000; // Default fallback
    const calculatedMax = Math.ceil(Math.max(...priceRangeData.products.map((p: any) => p.price || 0)));
    console.log('Max price calculated:', calculatedMax, 'for category:', selectedCategoryId, 'search:', searchQuery);
    return calculatedMax;
  }, [priceRangeData, selectedCategoryId, searchQuery]);

  const displayCategories = categories;
  const displayProducts = productsData || { products: [], pagination: null };

  // If store info fails, show tenant not found
  if (storeInfoError) {
    return <TenantNotFound />;
  }

  // Build category URL path (including parents)
  const buildCategoryPath = (categoryId: string, categoriesList: any[] = []): string => {
    const category = findCategoryById(categoryId, categoriesList);
    if (!category) return '';

    const slugs: string[] = [];
    let current = category;

    // Build path from bottom to top
    while (current) {
      slugs.unshift(current.slug);
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
    <StorefrontLayout
      storeInfo={storeInfo}
      storeSettings={storeSettings}
      categories={displayCategories}
      selectedCategoryId={selectedCategoryId}
      onCategorySelect={handleCategorySelect}
      onAllProductsClick={handleAllProductsClick}
      onCartClick={handleCartToggle}
      onSearchChange={handleSearchChange}
      onPriceRangeChange={handlePriceRangeChange}
      priceRange={priceInput}
      maxPrice={maxPrice}
      searchQuery={searchInput}
      isCartOpen={showCart}
      hideSidebar={false}
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Products Section */}
        <div id="products-section">
          {/* Category Breadcrumb & Grid Controls */}
          {selectedCategory && (
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                {/* Breadcrumb */}
                <nav className="overflow-x-auto scrollbar-hide">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 whitespace-nowrap min-w-max">
                    <button
                      onClick={handleAllProductsClick}
                      className="hover:text-gray-900 transition-colors flex-shrink-0 px-1"
                    >
                      Home
                    </button>
                    
                    {categoryHierarchy.map((cat, index) => (
                      <React.Fragment key={cat.id}>
                        <ChevronRightIcon className="w-3 h-3 mx-1 sm:mx-2 flex-shrink-0 text-gray-400" />
                        <button
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`transition-colors flex-shrink-0 px-1 ${
                            index === categoryHierarchy.length - 1
                              ? 'text-gray-900 font-medium'
                              : 'hover:text-gray-900'
                          }`}
                        >
                          {cat.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </nav>

                {/* Grid Layout Controls - Available on all screen sizes */}
                <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs sm:text-sm text-gray-600 px-1">View:</span>
                {/* 2 columns */}
                <button
                  onClick={() => handleGridLayoutChange(2)}
                  className={`group relative p-2 sm:p-2.5 rounded-md border transition-all ${
                    gridLayout === 2
                      ? 'border-gray-700 bg-gray-50'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  title="2 columns"
                >
                  <div className="flex gap-0.5 sm:gap-1">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1.5 sm:w-2 h-4 sm:h-5 rounded-sm transition-colors ${
                          gridLayout === 2
                            ? 'bg-gray-700'
                            : 'bg-gray-400 group-hover:bg-gray-600'
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
                      ? 'border-gray-700 bg-gray-50'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  title="3 columns"
                >
                  <div className="flex gap-0.5 sm:gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1 sm:w-1.5 h-4 sm:h-5 rounded-sm transition-colors ${
                          gridLayout === 3
                            ? 'bg-gray-700'
                            : 'bg-gray-400 group-hover:bg-gray-600'
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
                      ? 'border-gray-700 bg-gray-50'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  title="4 columns"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1 sm:w-1.5 h-4 sm:h-5 rounded-sm transition-colors ${
                          gridLayout === 4
                            ? 'bg-gray-700'
                            : 'bg-gray-400 group-hover:bg-gray-600'
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
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : categoryProductsQueries.data && categoryProductsQueries.data.length > 0 ? (
              <div className="space-y-8">
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
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <CubeIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products available
                </h3>
                <p className="text-gray-600 mb-6">
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
                    className="px-6 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Clear Price Filter
                  </button>
                )}
              </div>
            )
          ) : (
            /* Filtered view - show products in grid */
            productsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : displayProducts?.products?.length ? (
              <>
                <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
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
                    />
                  ))}
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
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <CubeIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedCategory ? `No products found in ${selectedCategory.name}` : 'No products found'}
                </h3>
                <p className="text-gray-600 mb-6">
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
                    className="px-6 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

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
    </StorefrontLayout>
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