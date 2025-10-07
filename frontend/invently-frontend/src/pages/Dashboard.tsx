import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesAPI, productsAPI, ordersAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { T } from '../components/Translation';
import {
  PlusIcon,
  EyeIcon,
  CubeIcon,
  PencilIcon,
  FolderIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, tenants } = useAuth();
  const { t } = useLanguage();
  const currentTenant = tenants[0];
  const navigate = useNavigate();

  const { data: orderStats, isLoading: orderStatsLoading } = useQuery({
    queryKey: ['orderStats'],
    queryFn: () => ordersAPI.getOrderStats(),
  });

  const { data: allProducts } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsAPI.list({ limit: 1000 }),
  });

  const { data: allCategories } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoriesAPI.list({ limit: 1000 }),
  });

  const totalCategories = allCategories?.pagination.total || 0;
  const activeProducts = allProducts?.products?.filter(p => p.status === 'ACTIVE').length || 0;
  const draftProducts = allProducts?.products?.filter(p => p.status === 'DRAFT').length || 0;
  const pendingOrders = orderStats?.recentOrders?.filter(order => order.status === 'PENDING').length || 0;

  const stats = [
    {
      name: t('dashboard.stats.totalOrders'),
      value: orderStats?.totalOrders || 0,
      icon: ShoppingBagIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      link: '/admin/orders',
    },
    {
      name: t('dashboard.stats.pendingOrders'),
      value: pendingOrders,
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      link: '/admin/orders',
    },
    {
      name: t('dashboard.stats.totalRevenue'),
      value: `$${(orderStats?.monthlyRevenue || 0).toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      link: '/admin/orders',
    },
    {
      name: t('dashboard.stats.totalProducts'),
      value: activeProducts,
      icon: CubeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      link: '/admin/products',
    },
    {
      name: t('products.status.draft'),
      value: draftProducts,
      icon: PencilIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      link: '/admin/products',
    },
    {
      name: t('navigation.categories'),
      value: totalCategories,
      icon: FolderIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      link: '/admin/categories',
    },
  ];


  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6 -m-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
            <T tKey="dashboard.title" />
          </h1>
          <p className="text-gray-600 mt-1">
            <T tKey="dashboard.welcome" params={{ name: user?.firstName || '' }} /> {currentTenant?.name || t('dashboard.overview')}.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          <T tKey="dashboard.quickActions" />
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
                <div className="font-bold text-lg"><T tKey="dashboard.addProduct" /></div>
                <div className="text-blue-100 text-sm"><T tKey="products.form.basicInfo" /></div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-lg mr-4">
                <ShoppingBagIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-lg"><T tKey="dashboard.manageOrders" /></div>
                <div className="text-purple-100 text-sm"><T tKey="navigation.orders" /></div>
              </div>
            </div>
          </Link>

          <a
            href={`http://${currentTenant?.subdomain || 'demo'}.${window.location.hostname.includes('localhost') ? 'localhost:3000' : 'momigvare.ge'}/store`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-lg mr-4">
                <EyeIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-lg"><T tKey="dashboard.viewStorefront" /></div>
                <div className="text-green-100 text-sm"><T tKey="navigation.storefront" /></div>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
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

      {/* Recent Orders */}
      <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center">
              <ShoppingBagIcon className="h-6 w-6 mr-2" />
              <T tKey="dashboard.recentOrders" />
            </h3>
            <Link
              to="/admin/orders"
              className="text-white/90 hover:text-white text-sm font-medium underline underline-offset-2 transition-colors"
            >
              <T tKey="dashboard.viewAll" />
            </Link>
          </div>
        </div>
        <div className="p-6">
          {orderStatsLoading ? (
            <LoadingSpinner />
          ) : orderStats?.recentOrders?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderStats.recentOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 transition-all duration-200 hover:scale-102 hover:shadow-md cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{order.orderNumber}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">${order.totalAmount.toFixed(2)}</span> •
                      <span className="truncate ml-1">{order.customerName}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="flex items-center justify-end">
                      <StatusBadge status={order.status} type="order" showIcon={true} size="sm" />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <ShoppingBagIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div className="text-lg font-medium text-gray-900 mb-2">
                <T tKey="dashboard.noOrdersYet" />
              </div>
              <p className="text-gray-600 text-sm">
                <T tKey="dashboard.noOrdersDescription" />
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;