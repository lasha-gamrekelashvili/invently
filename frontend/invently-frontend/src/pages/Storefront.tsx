import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TenantNotFound from '../components/TenantNotFound';
import StorefrontLayout from '../components/StorefrontLayout';
import StorefrontHero from '../components/StorefrontHero';
import StorefrontPagination from '../components/StorefrontPagination';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import Checkout from '../components/Checkout';
import { CartProvider, useCart } from '../contexts/CartContext';
import { CubeIcon } from '@heroicons/react/24/outline';

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
    retry: false,
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching new page
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
      gridLayout={gridLayout}
      onGridLayoutChange={handleGridLayoutChange}
      searchQuery={searchInput}
    >
      <div className="space-y-8">
        {/* Hero Section - Only show when no category is selected */}
        {!selectedCategoryId && (
          <StorefrontHero
            storeInfo={storeInfo}
            onShopNowClick={() => {
              // Scroll to products section
              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* Products Section */}
        <div id="products-section">
          {/* Category Breadcrumb */}
          {selectedCategory && (
            <div className="mb-6 flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-lg p-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Browsing category</p>
                <h2 className="text-base font-semibold text-gray-900">{selectedCategory.name}</h2>
              </div>
              <button
                onClick={() => {
                  navigate('/');
                  setPriceInput({ min: '', max: '' });
                  setPriceRange({ min: '', max: '' });
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}

          {productsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : displayProducts?.products?.length ? (
            <>
              <div className={`grid gap-6 ${
                gridLayout === 2 
                  ? 'grid-cols-1 sm:grid-cols-2' 
                  : gridLayout === 3 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
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
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Clear Filters
                </button>
              )}
            </div>
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