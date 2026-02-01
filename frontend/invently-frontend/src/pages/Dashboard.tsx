import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI, productsAPI, ordersAPI, paymentAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { T } from '../components/Translation';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import ConfirmationModal from '../components/ConfirmationModal';
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
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, tenants } = useAuth();
  const { t } = useLanguage();
  const currentTenant = tenants[0];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);

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

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => paymentAPI.getSubscription(),
    retry: false,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['tenantPayments'],
    queryFn: () => paymentAPI.getTenantPayments(),
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => paymentAPI.cancelSubscription(),
    onSuccess: () => {
      handleSuccess(t('billing.subscriptionCancelled'));
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowCancelModal(false);
    },
    onError: (error) => {
      handleApiError(error, t('billing.cancelError'));
    },
  });

  const totalCategories = allCategories?.pagination.total || 0;
  const activeProducts = allProducts?.products?.filter(p => p.isActive && !p.isDeleted).length || 0;
  const draftProducts = allProducts?.products?.filter(p => !p.isActive && !p.isDeleted).length || 0;
  const pendingOrders = orderStats?.recentOrders?.filter(order => order.status === 'PENDING').length || 0;

  const stats = [
    {
      name: t('dashboard.stats.totalOrders'),
      value: orderStats?.totalOrders || 0,
      icon: ShoppingBagIcon,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-200',
      link: '/admin/orders',
    },
    {
      name: t('dashboard.stats.pendingOrders'),
      value: pendingOrders,
      icon: ClockIcon,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-200',
      link: '/admin/orders',
    },
    {
      name: t('dashboard.stats.totalRevenue'),
      value: `$${(orderStats?.monthlyRevenue || 0).toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-200',
      link: '/admin/orders',
    },
    {
      name: t('dashboard.stats.totalProducts'),
      value: activeProducts,
      icon: CubeIcon,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-200',
      link: '/admin/products',
    },
    {
      name: t('products.status.draft'),
      value: draftProducts,
      icon: PencilIcon,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-200',
      link: '/admin/products',
    },
    {
      name: t('navigation.categories'),
      value: totalCategories,
      icon: FolderIcon,
      color: 'text-neutral-900',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-200',
      link: '/admin/categories',
    },
  ];


  return (
    <div className="space-y-8 bg-neutral-50 min-h-screen p-6 -m-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-neutral-900 flex items-center tracking-tight">
            <ChartBarIcon className="h-8 w-8 mr-3 text-neutral-900" />
            <T tKey="dashboard.title" />
          </h1>
          <p className="text-neutral-500 mt-1">
            <T tKey="dashboard.welcome" params={{ name: user?.firstName || '' }} />
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-xl font-light text-neutral-900 mb-6 tracking-tight">
          <T tKey="dashboard.quickActions" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/products/new"
            className="bg-neutral-800 text-white p-6 rounded-2xl hover:bg-neutral-700 transition-colors border border-neutral-800"
          >
            <div className="flex items-center">
              <div className="bg-white/10 p-3 rounded-lg mr-4">
                <PlusIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-medium text-lg"><T tKey="dashboard.addProduct" /></div>
                <div className="text-neutral-300 text-sm"><T tKey="products.form.basicInfo" /></div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/orders"
            className="bg-neutral-800 text-white p-6 rounded-2xl hover:bg-neutral-700 transition-colors border border-neutral-800"
          >
            <div className="flex items-center">
              <div className="bg-white/10 p-3 rounded-lg mr-4">
                <ShoppingBagIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-medium text-lg"><T tKey="dashboard.manageOrders" /></div>
                <div className="text-neutral-300 text-sm"><T tKey="navigation.orders" /></div>
              </div>
            </div>
          </Link>

          <a
            href={`http://${currentTenant?.subdomain || 'demo'}.${window.location.hostname.includes('localhost') ? 'localhost:3000' : 'shopu.ge'}/store`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-neutral-800 text-white p-6 rounded-2xl hover:bg-neutral-700 transition-colors border border-neutral-800"
          >
            <div className="flex items-center">
              <div className="bg-white/10 p-3 rounded-lg mr-4">
                <EyeIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-medium text-lg"><T tKey="dashboard.viewStorefront" /></div>
                <div className="text-neutral-400 text-sm"><T tKey="navigation.storefront" /></div>
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
            className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-md shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <div className="text-3xl font-light text-neutral-900">
                    {stat.value}
                  </div>
                  <div className="text-sm text-neutral-500 font-medium">{stat.name}</div>
                </div>
              </div>
              <div className="text-neutral-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Billing & Subscription */}
      <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-100 px-6 py-4 border-b border-neutral-200">
          <h3 className="text-xl font-light text-neutral-900 flex items-center tracking-tight">
            <CreditCardIcon className="h-6 w-6 mr-2" />
            <T tKey="billing.title" />
          </h3>
        </div>
        <div className="p-6">
          {subscriptionLoading ? (
            <LoadingSpinner />
          ) : subscription ? (
            <div className="space-y-6">
              {/* Subscription Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-neutral-900">
                      <T tKey="billing.subscriptionStatus" />
                    </h4>
                    <StatusBadge
                      status={subscription.status}
                      type="subscription"
                      showIcon={true}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        <T tKey="billing.monthlyFee" />
                      </span>
                      <span className="text-lg font-semibold text-neutral-900">49.00 GEL</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        <T tKey="billing.currentPeriod" />
                      </span>
                      <span className="text-sm text-neutral-900">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <T tKey="billing.nextBilling" />
                      </span>
                      <span className="text-sm font-medium text-neutral-900">
                        {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {subscription.status === 'ACTIVE' && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="mt-4 w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <T tKey="billing.cancelSubscription" />
                    </button>
                  )}
                </div>

                {/* Payment History */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h4 className="text-lg font-medium text-neutral-900 mb-4">
                    <T tKey="billing.recentPayments" />
                  </h4>
                  {paymentsLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : payments && payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment: any) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-neutral-900">
                              {payment.type === 'SETUP_FEE' ? t('billing.setupFee') : t('billing.monthlySubscription')}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-neutral-900">
                              {payment.amount.toFixed(2)} GEL
                            </div>
                            <div className="flex items-center justify-end mt-1">
                              {payment.status === 'PAID' ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                              ) : payment.status === 'FAILED' ? (
                                <XCircleIcon className="h-4 w-4 text-red-600" />
                              ) : (
                                <ClockIcon className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className={`text-xs ml-1 ${
                                payment.status === 'PAID' ? 'text-green-600' :
                                payment.status === 'FAILED' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {payments.length > 5 && (
                        <Link
                          to="/admin/settings?tab=account"
                          className="block text-center text-sm text-neutral-600 hover:text-neutral-900 mt-2"
                        >
                          <T tKey="billing.viewAllPayments" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500 text-sm">
                      <T tKey="billing.noPayments" />
                    </div>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h4 className="text-lg font-medium text-neutral-900 mb-4">
                  <T tKey="billing.accountInfo" />
                </h4>
                <div>
                  <span className="text-sm text-neutral-600">
                    <T tKey="billing.iban" />
                  </span>
                  <div className="mt-1 text-sm font-medium text-neutral-900">
                    {user?.iban || (
                      <span className="text-neutral-400 italic">
                        <T tKey="billing.noIban" />
                      </span>
                    )}
                  </div>
                </div>
                {!user?.iban && (
                  <Link
                    to="/admin/settings?tab=account"
                    className="mt-4 inline-block text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                  >
                    <T tKey="billing.addIban" /> →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-neutral-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="h-10 w-10 text-neutral-400" />
              </div>
              <div className="text-lg font-light text-neutral-900 mb-2">
                <T tKey="billing.noSubscription" />
              </div>
              <p className="text-neutral-500 text-sm">
                <T tKey="billing.noSubscriptionDescription" />
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => cancelSubscriptionMutation.mutate()}
          title={t('billing.cancelSubscription')}
          message={t('billing.cancelConfirmation')}
          confirmText={t('billing.confirmCancel')}
          cancelText={t('common.cancel')}
          type="danger"
          isLoading={cancelSubscriptionMutation.isPending}
        />
      )}

      {/* Recent Orders */}
      <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-light text-white flex items-center tracking-tight">
              <ShoppingBagIcon className="h-6 w-6 mr-2" />
              <T tKey="dashboard.recentOrders" />
            </h3>
            <Link
              to="/admin/orders"
              className="text-neutral-300 hover:text-white text-sm font-medium transition-colors"
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
              {orderStats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900 truncate">{order.orderNumber}</div>
                    <div className="text-sm text-neutral-500 mt-1">
                      <span className="font-medium">${order.totalAmount.toFixed(2)}</span> •
                      <span className="truncate ml-1">{order.customerName}</span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="flex items-center justify-end">
                      <StatusBadge status={order.status} type="order" showIcon={true} size="sm" />
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-neutral-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <ShoppingBagIcon className="h-10 w-10 text-neutral-400" />
              </div>
              <div className="text-lg font-light text-neutral-900 mb-2">
                <T tKey="dashboard.noOrdersYet" />
              </div>
              <p className="text-neutral-500 text-sm">
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