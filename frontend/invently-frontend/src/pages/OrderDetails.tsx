import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
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
  CubeIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { getRegionById, getDistrictById } from '../data/georgianRegions';

const OrderDetails = () => {
  const { t, language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Map refs and state
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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
        return <CheckCircleIcon className="h-4 w-4 text-neutral-900" />;
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
        return 'bg-neutral-100 text-neutral-900 border-neutral-200';
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

  // Check if shipping address has Georgian format (new format with coordinates)
  const isGeorgianAddress = order?.shippingAddress?.coordinates && order?.shippingAddress?.region;

  // Load Google Maps script
  useEffect(() => {
    if (!isGeorgianAddress) return;
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          setMapLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        setMapLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, [isGeorgianAddress]);

  // Initialize map with marker
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !order?.shippingAddress?.coordinates) return;

    const { lat, lng } = order.shippingAddress.coordinates;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
    } else {
      mapInstanceRef.current.setCenter({ lat, lng });
    }

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      animation: window.google.maps.Animation.DROP,
    });
  }, [mapLoaded, order?.shippingAddress?.coordinates]);

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
          className="inline-flex items-center px-4 py-2 bg-neutral-800 text-white rounded-full hover:bg-neutral-700 transition-colors"
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
            <div className="px-4 py-2 sm:px-6 sm:py-3">
              <div className="space-y-3">
                {order.items.map((item) => {
                  const productImage = item.product?.images?.[0]?.url;
                  const isProductDeleted = item.product?.isDeleted;
                  const canNavigate = item.product && item.productId;
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => canNavigate && navigate(`/admin/products/${item.productId}/edit`)}
                      className={`flex items-center p-3 rounded-lg transition-all ${
                        canNavigate 
                          ? 'bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-200 cursor-pointer border border-transparent' 
                          : 'bg-neutral-50'
                      } ${isProductDeleted ? 'opacity-75' : ''}`}
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gray-200 mr-3">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={item.title}
                            className={`w-full h-full object-cover ${isProductDeleted ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <CubeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          canNavigate ? 'text-neutral-900 hover:text-neutral-700' : 'text-neutral-900'
                        } ${isProductDeleted ? 'line-through text-neutral-500' : ''}`}>
                          {item.title}
                        </h4>
                        {isProductDeleted && (
                          <span className="text-xs text-red-500 font-medium">Product deleted</span>
                        )}
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                          <span>{t('orders.orderDetails.sections.orderItems.quantity')}: {item.quantity}</span>
                          <span className="mx-1.5">•</span>
                          <span>{t('orders.orderDetails.sections.orderItems.unitPrice')}: ${item.price.toFixed(2)}</span>
                        </div>
                        {item.variantData && Object.keys(item.variantData).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(item.variantData).map(([key, value]) => (
                              <span key={key} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Item Total */}
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
            <div className="px-4 py-2 sm:px-6 sm:py-3">
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

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                  {t('orders.orderDetails.sections.addresses.shippingAddress')}
                </h3>
              </div>
              <div className="px-4 py-2 sm:px-6 sm:py-3">
                {/* Georgian Format Address (New) */}
                {isGeorgianAddress ? (
                  (() => {
                    const region = getRegionById(order.shippingAddress.region);
                    const district = getDistrictById(order.shippingAddress.region, order.shippingAddress.district);
                    const regionDisplayName = language === 'ka' ? (region?.nameKa || order.shippingAddress.region) : (region?.name || order.shippingAddress.region);
                    const districtDisplayName = language === 'ka' ? (district?.nameKa || order.shippingAddress.district) : (district?.name || order.shippingAddress.district);
                    
                    return (
                      <div className="space-y-4">
                        {/* Address Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">{t('orders.orderDetails.sections.addresses.region')}</p>
                            <p className="text-sm text-gray-900">{regionDisplayName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">{t('orders.orderDetails.sections.addresses.district')}</p>
                            <p className="text-sm text-gray-900">{districtDisplayName}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">{t('orders.orderDetails.sections.addresses.fullAddress')}</p>
                          <p className="text-sm text-gray-900">{order.shippingAddress.address}</p>
                        </div>
                        {order.shippingAddress.notes && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">{t('orders.orderDetails.sections.addresses.notes')}</p>
                            <p className="text-sm text-gray-900">{order.shippingAddress.notes}</p>
                          </div>
                        )}
                        
                        {/* Coordinates and Directions */}
                        {order.shippingAddress.coordinates && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500">
                              <GlobeAltIcon className="h-3.5 w-3.5 mr-1" />
                              <span>{order.shippingAddress.coordinates.lat.toFixed(6)}, {order.shippingAddress.coordinates.lng.toFixed(6)}</span>
                            </div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${order.shippingAddress.coordinates.lat},${order.shippingAddress.coordinates.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1" />
                              {t('orders.orderDetails.sections.addresses.getDirections')}
                            </a>
                          </div>
                        )}

                        {/* Map */}
                        {order.shippingAddress.coordinates && (
                          <div className="mt-3">
                            <div 
                              ref={mapRef} 
                              className="w-full h-48 sm:h-64 rounded-lg border border-gray-200 bg-gray-100"
                            >
                              {!mapLoaded && (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                  {t('orders.orderDetails.sections.addresses.loadingMap')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  /* Legacy Format Address */
                  <div className="text-sm text-gray-600 space-y-0.5">
                    {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                    {(order.shippingAddress.city || order.shippingAddress.state || order.shippingAddress.zipCode) && (
                      <p>{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zipCode].filter(Boolean).join(', ')}</p>
                    )}
                    {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                  </div>
                )}
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
              <div className="px-4 py-2 sm:px-6 sm:py-3">
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
            <div className="px-4 py-2 sm:px-6 sm:py-3">
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
            <div className="px-4 py-2 sm:px-6 sm:py-3">
              <div className="space-y-2">
                {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updateOrderMutation.isPending || order.status === status}
                    className={`w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                      order.status === status
                        ? 'bg-neutral-100 text-neutral-900 border-neutral-200 cursor-not-allowed'
                        : updateOrderMutation.isPending
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400'
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
            <div className="px-4 py-2 sm:px-6 sm:py-3">
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
                    <div className="flex-shrink-0 w-2 h-2 bg-neutral-400 rounded-full mt-1.5"></div>
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