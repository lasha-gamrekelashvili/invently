import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesAPI, productsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PlusIcon,
  EyeIcon,
  CubeIcon,
  PencilIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, tenants } = useAuth();
  const currentTenant = tenants[0];

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list({ limit: 5 }),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.list({ limit: 5 }),
  });

  const { data: allProducts } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsAPI.list({ limit: 1000 }),
  });

  const { data: allCategories } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoriesAPI.list({ limit: 1000 }),
  });

  const totalProducts = allProducts?.pagination.total || 0;
  const totalCategories = allCategories?.pagination.total || 0;
  const activeProducts = allProducts?.products?.filter(p => p.status === 'ACTIVE').length || 0;
  const draftProducts = allProducts?.products?.filter(p => p.status === 'DRAFT').length || 0;

  const stats = [
    {
      name: 'Total Products',
      value: totalProducts,
      icon: CubeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      name: 'Active Products',
      value: activeProducts,
      icon: EyeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      name: 'Draft Products',
      value: draftProducts,
      icon: PencilIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      name: 'Categories',
      value: totalCategories,
      icon: FolderIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6 -m-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-lg text-gray-600">
          Here's what's happening with {currentTenant?.name || 'your shop'} today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/products/new"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-lg mr-4">
                <PlusIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-lg">Add Product</div>
                <div className="text-blue-100 text-sm">Create a new product</div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/categories/new"
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-lg mr-4">
                <PlusIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-lg">Add Category</div>
                <div className="text-purple-100 text-sm">Create a new category</div>
              </div>
            </div>
          </Link>

          <a
            href={`http://${currentTenant?.subdomain || 'demo'}.${window.location.hostname.includes('localhost') ? 'localhost:3000' : 'example.com'}/store`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-lg mr-4">
                <EyeIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-lg">View Store</div>
                <div className="text-green-100 text-sm">See your public store</div>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.name.includes('Product') ? '/admin/products' : '/admin/categories'}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.name}</div>
                </div>
              </div>
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <CubeIcon className="h-6 w-6 mr-2" />
                Recent Products
              </h3>
              <Link
                to="/admin/products"
                className="text-white/90 hover:text-white text-sm font-medium underline underline-offset-2 transition-colors"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {productsLoading ? (
              <LoadingSpinner />
            ) : productsData?.products?.length ? (
              <div className="space-y-4">
                {productsData.products.slice(0, 5).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 transition-all duration-200 hover:scale-102 hover:shadow-md"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{product.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">${product.price}</span> • {product.stockQuantity} in stock
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                        product.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <CubeIcon className="h-10 w-10 text-blue-600" />
                </div>
                <div className="text-lg font-medium text-gray-900 mb-2">No products yet</div>
                <Link
                  to="/admin/products"
                  className="inline-block btn-outline text-sm"
                >
                  Create your first product
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Categories */}
        <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FolderIcon className="h-6 w-6 mr-2" />
                Categories
              </h3>
              <Link
                to="/admin/categories"
                className="text-white/90 hover:text-white text-sm font-medium underline underline-offset-2 transition-colors"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {categoriesLoading ? (
              <LoadingSpinner />
            ) : categoriesData?.categories?.length ? (
              <div className="space-y-4">
                {categoriesData.categories.slice(0, 5).map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-purple-50 hover:to-pink-50 transition-all duration-200 hover:scale-102 hover:shadow-md"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div>
                      <div className="font-semibold text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {category._count?.products || 0} products
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-600">
                        {category._count?.products || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FolderIcon className="h-10 w-10 text-purple-600" />
                </div>
                <div className="text-lg font-medium text-gray-900 mb-2">No categories yet</div>
                <Link
                  to="/admin/categories"
                  className="inline-block btn-outline text-sm"
                >
                  Create your first category
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;