import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { storefrontAPI, ordersAPI } from '../utils/api';
import { useCart, CartProvider } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import StorefrontLayout from '../components/StorefrontLayout';
import Cart from '../components/Cart';
import CustomDropdown from '../components/CustomDropdown';
import { georgianRegions, getRegionById } from '../data/georgianRegions';
import {
  ShoppingBagIcon,
  TruckIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const CheckoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { cart, sessionId, clearCart } = useCart();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [showCart, setShowCart] = useState(false);
  const [cartClosing, setCartClosing] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Reverse geocode coordinates to get address from Google
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          setFormData(prev => ({
            ...prev,
            shippingAddress: {
              ...prev.shippingAddress,
              address: results[0].formatted_address,
              coordinates: { lat, lng },
            },
          }));
        }
      }
    );
  }, []);

  // Handle cart toggle with animation
  const handleCartToggle = () => {
    if (showCart && !cartClosing) {
      setCartClosing(true);
    } else if (!showCart) {
      setShowCart(true);
      setCartClosing(false);
    }
  };

  const handleCartCloseComplete = () => {
    setShowCart(false);
    setCartClosing(false);
  };

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    shippingAddress: {
      region: '',
      district: '',
      address: '',
      notes: '',
      coordinates: null as { lat: number; lng: number } | null,
    },
    orderNotes: '',
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

  // Get districts for selected region
  const selectedRegion = getRegionById(formData.shippingAddress.region);
  const districtOptions = selectedRegion
    ? [
        { value: '', label: t('storefront.checkout.selectDistrict') },
        ...selectedRegion.districts.map(d => ({
          value: d.id,
          label: language === 'ka' ? d.nameKa : d.name,
        })),
      ]
    : [{ value: '', label: t('storefront.checkout.selectDistrict') }];

  const regionOptions = [
    { value: '', label: t('storefront.checkout.selectRegion') },
    ...georgianRegions.map(r => ({
      value: r.id,
      label: language === 'ka' ? r.nameKa : r.name,
    })),
  ];

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    // Skip if no API key
    if (!apiKey) {
      console.warn('Google Maps API key not configured. Map functionality disabled.');
      return;
    }

    // Already loaded
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script exists, wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          setMapLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Create and load script with Places library for autocomplete
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google?.maps) {
        setMapLoaded(true);
      }
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };

    document.head.appendChild(script);
  }, []);

  // Initialize map when region is selected
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !selectedRegion) return;

    const center = selectedRegion.center;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Add click listener to place marker
      mapInstanceRef.current.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        placeMarker({ lat, lng });
      });
    } else {
      // Update center when region changes
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(13);
    }

    // If coordinates exist, place marker
    if (formData.shippingAddress.coordinates) {
      placeMarker(formData.shippingAddress.coordinates);
    }
  }, [mapLoaded, selectedRegion]);

  const placeMarker = useCallback((position: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Create new marker
    markerRef.current = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    // Update coordinates and address on drag
    markerRef.current.addListener('dragend', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      reverseGeocode(lat, lng);
    });

    // Reverse geocode the initial position
    reverseGeocode(position.lat, position.lng);
  }, [reverseGeocode]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!mapLoaded || !addressInputRef.current || !selectedRegion) return;
    if (!window.google?.maps?.places) return;

    // Destroy existing autocomplete
    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    // Create autocomplete - use 'geocode' for neighborhoods, districts, and addresses
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        componentRestrictions: { country: 'ge' }, // Restrict to Georgia
        fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        types: ['geocode'], // Includes neighborhoods, districts, streets
      }
    );

    // Bias results to selected region
    if (selectedRegion.center) {
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(selectedRegion.center.lat - 0.1, selectedRegion.center.lng - 0.1),
        new window.google.maps.LatLng(selectedRegion.center.lat + 0.1, selectedRegion.center.lng + 0.1)
      );
      autocompleteRef.current.setBounds(bounds);
    }

    // Handle place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Update address field
        setFormData(prev => ({
          ...prev,
          shippingAddress: {
            ...prev.shippingAddress,
            address: place.formatted_address || place.name || prev.shippingAddress.address,
          },
        }));

        // Place marker and center map
        placeMarker({ lat, lng });
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(17);
        }
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [mapLoaded, selectedRegion, placeMarker]);

  // Update map when district changes - geocode district name to get center
  useEffect(() => {
    if (!mapLoaded || !formData.shippingAddress.district || !selectedRegion) return;
    if (!window.google?.maps) return;

    const selectedDistrict = selectedRegion.districts.find(
      d => d.id === formData.shippingAddress.district
    );
    if (!selectedDistrict) return;

    // Initialize geocoder if needed
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    // Geocode the district name to find its center
    const searchQuery = `${selectedDistrict.name}, ${selectedRegion.name}, Georgia`;
    
    geocoderRef.current.geocode(
      { address: searchQuery },
      (results: any[], status: string) => {
        if (status === 'OK' && results[0]?.geometry?.location) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();

          // Center map on district
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(14);
          }

          // Place marker and get address
          placeMarker({ lat, lng });
        }
      }
    );
  }, [mapLoaded, formData.shippingAddress.district, selectedRegion, placeMarker]);

  const createOrderMutation = useMutation({
    mutationFn: () => ordersAPI.createOrder({
      sessionId,
      customerEmail: formData.customerEmail,
      customerName: formData.customerName,
      shippingAddress: {
        region: formData.shippingAddress.region,
        regionName: selectedRegion ? { en: selectedRegion.name, ka: selectedRegion.nameKa } : undefined,
        district: formData.shippingAddress.district,
        districtName: (() => {
          const district = selectedRegion?.districts.find(d => d.id === formData.shippingAddress.district);
          return district ? { en: district.name, ka: district.nameKa } : undefined;
        })(),
        address: formData.shippingAddress.address,
        notes: formData.shippingAddress.notes,
        coordinates: formData.shippingAddress.coordinates,
      },
      notes: formData.orderNotes,
    }),
    onSuccess: (order) => {
      setOrderNumber(order.orderNumber);
      setStep('success');
      setTimeout(() => {
        clearCart();
      }, 1000);
    },
    onError: (error: any) => {
      setStep('form');
      toast.error(error.response?.data?.message || 'Failed to create order');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.shippingAddress.region) {
      toast.error(t('storefront.checkout.selectRegion'));
      return;
    }
    if (!formData.shippingAddress.district) {
      toast.error(t('storefront.checkout.selectDistrict'));
      return;
    }
    if (!formData.shippingAddress.address) {
      toast.error(t('storefront.checkout.addressPlaceholder'));
      return;
    }
    if (!formData.shippingAddress.coordinates) {
      toast.error(t('storefront.checkout.pinLocationRequired'));
      return;
    }

    setStep('processing');
    setTimeout(() => {
      createOrderMutation.mutate();
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('shippingAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [addressField]: value,
          // Reset district when region changes
          ...(addressField === 'region' ? { district: '', coordinates: null } : {}),
        },
      }));
      
      // Remove marker when region changes
      if (addressField === 'region' && markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // If cart is empty, redirect to home
  if (!cart?.items?.length && step !== 'success') {
    return (
      <StorefrontLayout
        storeInfo={storeInfo}
        storeSettings={storeSettings}
        categories={categories}
        onCartClick={handleCartToggle}
        isCartOpen={showCart}
        hideSidebar={true}
      >
        <div className="max-w-2xl mx-auto py-16 text-center">
          <ShoppingBagIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            {t('storefront.checkout.cartEmpty')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-6">
            {t('storefront.checkout.cartEmptyDescription')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {t('storefront.checkout.continueShopping')}
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout
      storeInfo={storeInfo}
      storeSettings={storeSettings}
      categories={categories}
      onCartClick={handleCartToggle}
      isCartOpen={showCart}
      hideSidebar={true}
    >
      {step === 'form' && (
        <div className="max-w-5xl mx-auto">
          {/* Go Back */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              {t('storefront.checkout.goBack')}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                      1
                    </div>
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                      {t('storefront.checkout.customerInfo')}
                    </h2>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        {t('storefront.checkout.fullName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        className="input-field"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        {t('storefront.checkout.email')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.customerEmail}
                        onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                        className="input-field"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                      2
                    </div>
                    <div className="flex items-center gap-2">
                      <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                        {t('storefront.checkout.shippingAddress')}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Region & District */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        {t('storefront.checkout.region')} <span className="text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={formData.shippingAddress.region}
                        onChange={(value) => handleInputChange('shippingAddress.region', value)}
                        options={regionOptions}
                        placeholder={t('storefront.checkout.selectRegion')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        {t('storefront.checkout.district')} <span className="text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        value={formData.shippingAddress.district}
                        onChange={(value) => handleInputChange('shippingAddress.district', value)}
                        options={districtOptions}
                        placeholder={t('storefront.checkout.selectDistrict')}
                        disabled={!formData.shippingAddress.region}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      {t('storefront.checkout.address')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={addressInputRef}
                      type="text"
                      required
                      value={formData.shippingAddress.address}
                      onChange={(e) => handleInputChange('shippingAddress.address', e.target.value)}
                      className="input-field"
                      placeholder={t('storefront.checkout.addressPlaceholder')}
                      autoComplete="off"
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      {t('storefront.checkout.additionalNotes')}
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.notes}
                      onChange={(e) => handleInputChange('shippingAddress.notes', e.target.value)}
                      className="input-field"
                      placeholder={t('storefront.checkout.additionalNotesPlaceholder')}
                    />
                  </div>

                  {/* Map */}
                  {formData.shippingAddress.region && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        {t('storefront.checkout.pinLocation')} <span className="text-red-500">*</span>
                      </label>
                      <div 
                        ref={mapRef}
                        className="w-full h-64 sm:h-80 rounded-lg border border-gray-300 bg-gray-100"
                      >
                        {!mapLoaded && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      {formData.shippingAddress.coordinates && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                          <MapPinIcon className="w-4 h-4" />
                          <span>
                            {language === 'ka' ? 'მდებარეობა მონიშნულია' : 'Location pinned'}: 
                            {formData.shippingAddress.coordinates.lat.toFixed(6)}, 
                            {formData.shippingAddress.coordinates.lng.toFixed(6)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Notes Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs sm:text-sm font-semibold">
                      3
                    </div>
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                      {t('storefront.checkout.orderNotes')}
                    </h2>
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </div>
                </div>
                <div className="p-5">
                  <textarea
                    rows={3}
                    value={formData.orderNotes}
                    onChange={(e) => handleInputChange('orderNotes', e.target.value)}
                    className="input-field resize-none"
                    placeholder={t('storefront.checkout.orderNotesPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                      {t('storefront.checkout.orderSummary')}
                    </h2>
                  </div>
                </div>
                
                {/* Cart Items */}
                <div className="p-5 space-y-4 max-h-64 overflow-y-auto">
                  {cart?.items.map((item) => {
                    const isUnavailable = item.isAvailable === false;
                    const isProductGone = item.product?.isDeleted || !item.product?.isActive || !item.product;
                    const hasStockIssue = !isProductGone && (item.isOutOfStock || !item.hasEnoughStock);
                    
                    return (
                      <div key={item.id} className={`flex gap-3 ${isUnavailable ? 'opacity-75' : ''}`}>
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ${isProductGone ? 'grayscale' : ''}`}>
                          {item.product.images?.[0]?.url ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs sm:text-sm font-medium truncate ${isProductGone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.product.title}
                          </h4>
                          {isProductGone && (
                            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              {language === 'ka' ? 'აღარ არის ხელმისაწვდომი' : 'No longer available'}
                            </p>
                          )}
                          {hasStockIssue && (
                            <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              {item.isOutOfStock 
                                ? (language === 'ka' ? 'მარაგი ამოწურულია' : 'Out of stock')
                                : (language === 'ka' ? `მხოლოდ ${item.availableStock} ხელმისაწვდომია` : `Only ${item.availableStock} available`)
                              }
                            </p>
                          )}
                          {item.variant && !isUnavailable && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {Object.values(item.variant.options || {}).join(' / ')}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${hasStockIssue ? 'text-amber-600' : 'text-gray-500'}`}>
                              {language === 'ka' ? 'რაოდენობა' : 'Qty'}: {item.quantity}
                            </span>
                            <span className={`text-xs sm:text-sm font-semibold ${isUnavailable ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              ₾{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>{t('storefront.checkout.subtotal')}</span>
                    <span>₾{cart?.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>{t('storefront.checkout.shipping')}</span>
                    <span className="text-green-600 font-medium">{t('storefront.checkout.shippingFree')}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>{t('storefront.checkout.total')}</span>
                    <span>₾{cart?.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="px-5 py-4 border-t border-gray-100">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <CreditCardIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-amber-800">
                        {t('storefront.checkout.demoCheckout')}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {t('storefront.checkout.demoCheckoutDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unavailable Items Warning */}
                {cart?.hasUnavailableItems && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                      cart.hasStockIssues && cart.unavailableCount === cart.stockIssueCount
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        cart.hasStockIssues && cart.unavailableCount === cart.stockIssueCount
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`} />
                      <div>
                        <p className={`text-xs font-medium ${
                          cart.hasStockIssues && cart.unavailableCount === cart.stockIssueCount
                            ? 'text-amber-800'
                            : 'text-red-800'
                        }`}>
                          {language === 'ka' ? 'შეკვეთის გაფორმება შეუძლებელია' : 'Cannot place order'}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          cart.hasStockIssues && cart.unavailableCount === cart.stockIssueCount
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}>
                          {cart.hasStockIssues && cart.unavailableCount === cart.stockIssueCount
                            ? (language === 'ka' 
                                ? 'ზოგიერთ პროდუქტს არ აქვს საკმარისი მარაგი' 
                                : 'Some items have insufficient stock')
                            : (language === 'ka' 
                                ? 'წაშალეთ მიუწვდომელი პროდუქტები კალათიდან' 
                                : 'Remove unavailable items from your cart first')
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="px-5 py-4 border-t border-gray-100">
                  <button
                    onClick={handleSubmit}
                    disabled={cart?.hasUnavailableItems}
                    className={`w-full py-3 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm ${
                      cart?.hasUnavailableItems
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                    }`}
                  >
                    {cart?.hasUnavailableItems 
                      ? t('storefront.checkout.fixCartFirst') 
                      : t('storefront.checkout.placeOrder')
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            {t('storefront.checkout.processing')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {language === 'ka' ? 'გთხოვთ დაელოდოთ შეკვეთის დადასტურებას...' : 'Please wait while we confirm your order...'}
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="max-w-lg mx-auto py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            {t('storefront.checkout.success')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            {language === 'ka' ? 'გმადლობთ შეკვეთისთვის. თქვენი შეკვეთის ნომერია:' : 'Thank you for your order. Your order number is:'}
          </p>
          <p className="text-base sm:text-lg font-bold text-gray-900 mb-6 font-mono bg-gray-100 inline-block px-4 py-2 rounded-lg">
            {orderNumber}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-8">
            {language === 'ka' ? 'თქვენ მალე მიიღებთ დადასტურების ელ-ფოსტას.' : 'You will receive a confirmation email shortly.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"
          >
            {t('storefront.checkout.continueShopping')}
          </button>
        </div>
      )}

      {/* Cart */}
      {showCart && (
        <Cart
          onClose={handleCartCloseComplete}
          isClosing={cartClosing}
        />
      )}
    </StorefrontLayout>
  );
};

const CheckoutPage: React.FC = () => {
  return (
    <CartProvider>
      <CheckoutContent />
    </CartProvider>
  );
};

export default CheckoutPage;
