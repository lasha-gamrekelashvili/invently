import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  EnvelopeIcon,
  UserIcon,
  MapPinIcon,
  CreditCardIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const OrderDetails = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getOrder(id!),
    enabled: !!id,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersAPI.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'CONFIRMED':
        return <CheckCircleIcon className="h-4 w-4 text-blue-600" />;
      case 'SHIPPED':
        return <TruckIcon className="h-4 w-4 text-purple-600" />;
      case 'DELIVERED':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'CANCELLED':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (order && id) {
      updateOrderMutation.mutate({ id, status });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <div className="text-lg font-medium text-gray-900 mb-2">{t('orders.orderDetails.notFound.title')}</div>
        <p className="text-gray-600 mb-4">{t('orders.orderDetails.notFound.description')}</p>
        <button
          onClick={() => navigate('/admin/orders')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          {t('orders.orderDetails.notFound.backButton')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/orders')}
            className="mr-3 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-gray-600" />
              {t('orders.orderDetails.header.orderNumber', { number: order.orderNumber })}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {t('orders.orderDetails.header.placedOn', { 
                date: new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              })}
            </p>
          </div>
        </div>

        {/* Current Status */}
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
            {t(`orders.status.${order.status.toLowerCase()}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">{t('orders.orderDetails.sections.orderItems.title')}</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <span>{t('orders.orderDetails.sections.orderItems.quantity')}: {item.quantity}</span>
                        <span className="mx-1.5">•</span>
                        <span>{t('orders.orderDetails.sections.orderItems.unitPrice')}: ${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{t('orders.orderDetails.sections.orderItems.totalAmount')}:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <UserIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                {t('orders.orderDetails.sections.customerInfo.title')}
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center text-gray-500 mb-1.5">
                    <UserIcon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-medium">{t('orders.orderDetails.sections.customerInfo.name')}</span>
                  </div>
                  <p className="text-sm text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <div className="flex items-center text-gray-500 mb-1.5">
                    <EnvelopeIcon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-medium">{t('orders.orderDetails.sections.customerInfo.email')}</span>
                  </div>
                  <p className="text-sm text-gray-900">{order.customerEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          {(order.shippingAddress || order.billingAddress) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                  {t('orders.orderDetails.sections.addresses.title')}
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.shippingAddress && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1.5">{t('orders.orderDetails.sections.addresses.shippingAddress')}</h4>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    </div>
                  )}
                  {order.billingAddress && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1.5">{t('orders.orderDetails.sections.addresses.billingAddress')}</h4>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>{order.billingAddress.street}</p>
                        <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}</p>
                        <p>{order.billingAddress.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                  {t('orders.orderDetails.sections.orderNotes.title')}
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-gray-600">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Management */}
        <div className="space-y-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <CreditCardIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                {t('orders.orderDetails.sections.payment.title')}
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">{t('orders.orderDetails.sections.payment.paymentStatus')}:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {t(`orders.paymentStatus.${order.paymentStatus.toLowerCase()}`)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">{t('orders.orderDetails.sections.payment.totalAmount')}:</span>
                  <span className="text-sm font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">{t('orders.orderDetails.sections.statusManagement.title')}</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-2">
                {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updateOrderMutation.isPending || order.status === status}
                    className={`w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                      order.status === status
                        ? 'bg-blue-50 text-blue-800 border-blue-200 cursor-not-allowed'
                        : updateOrderMutation.isPending
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {updateOrderMutation.isPending ? t('orders.orderDetails.sections.statusManagement.updating') : t(`orders.status.${status.toLowerCase()}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">{t('orders.orderDetails.sections.timeline.title')}</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-1.5"></div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm text-gray-900 font-medium">{t('orders.orderDetails.sections.timeline.orderPlaced')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                    <div className="ml-3">
                      <p className="text-xs sm:text-sm text-gray-900 font-medium">{t('orders.orderDetails.sections.timeline.lastUpdated')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(order.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;