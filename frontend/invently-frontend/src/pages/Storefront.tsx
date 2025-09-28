import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TenantNotFound from '../components/TenantNotFound';
import StorefrontLayout from '../components/StorefrontLayout';
import { FolderIcon, CubeIcon } from '@heroicons/react/24/outline';

const Storefront = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const { data: storeInfo, error: storeInfoError } = useQuery({
    queryKey: ['store-info'],
    queryFn: () => storefrontAPI.getStoreInfo(),
    retry: false,
  });

  const { data: categories } = useQuery({
    queryKey: ['storefront-categories'],
    queryFn: () => storefrontAPI.getCategories(),
    retry: false,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['storefront-products', selectedCategoryId],
    queryFn: () => storefrontAPI.getProducts({ categoryId: selectedCategoryId }),
    retry: false,
  });

  const displayCategories = categories;
  const displayProducts = productsData;

  // If store info fails, show tenant not found
  if (storeInfoError) {
    return <TenantNotFound />;
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? undefined : categoryId);
  };

  const handleAllProductsClick = () => {
    setSelectedCategoryId(undefined);
  };

  const selectedCategory = categories?.find(cat => cat.id === selectedCategoryId);

  return (
    <StorefrontLayout
      storeInfo={storeInfo}
      categories={displayCategories}
      selectedCategoryId={selectedCategoryId}
      onCategorySelect={handleCategorySelect}
      onAllProductsClick={handleAllProductsClick}
    >
      <div className="space-y-4">
        {/* Category Filter Info */}
        {selectedCategory && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FolderIcon className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Showing products in: <span className="font-semibold">{selectedCategory.name}</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedCategoryId(undefined)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear filter
              </button>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div>
          {productsLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : displayProducts?.products?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayProducts.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-w-16 aspect-h-12 mb-4">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.title}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center">
                        <CubeIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                          {product.title}
                        </h3>
                        <span className="text-2xl font-bold text-gray-900 ml-2">
                          ${product.price}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{product.stockQuantity} in stock</span>
                        {product.category && (
                          <span className="text-blue-600 font-medium">{product.category.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedCategory ? `No products found in ${selectedCategory.name}` : 'No products found'}
              </h3>
              <p className="text-gray-500">
                {selectedCategory 
                  ? 'Try selecting a different category or browse all products.'
                  : 'Check back later for new products!'
                }
              </p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategoryId(undefined)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  View All Products
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
};

export default Storefront;