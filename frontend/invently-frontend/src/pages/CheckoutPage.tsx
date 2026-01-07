import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { storefrontAPI, ordersAPI } from '../utils/api';
import { useCart, CartProvider } from '../contexts/CartContext';
import StorefrontLayout from '../components/StorefrontLayout';
import Cart from '../components/Cart';
import {
  ShoppingBagIcon,
  TruckIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CheckoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { cart, sessionId, clearCart } = useCart();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [showCart, setShowCart] = useState(false);
  const [cartClosing, setCartClosing] = useState(false);

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
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    notes: '',
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

  const createOrderMutation = useMutation({
    mutationFn: () => ordersAPI.createOrder({
      sessionId,
      customerEmail: formData.customerEmail,
      customerName: formData.customerName,
      shippingAddress: formData.shippingAddress,
      notes: formData.notes,
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
        },
      }));
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-6">Add some items to your cart to continue checkout.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Continue Shopping
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
              Go back
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                      1
                    </div>
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">Customer Information</h2>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.customerEmail}
                        onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
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
                    <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                      2
                    </div>
                    <div className="flex items-center gap-2">
                      <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900">Shipping Address</h2>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress.street}
                      onChange={(e) => handleInputChange('shippingAddress.street', e.target.value)}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.city}
                        onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                        placeholder="Tbilisi"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        State / Region
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.state}
                        onChange={(e) => handleInputChange('shippingAddress.state', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                        placeholder="Tbilisi"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.zipCode}
                        onChange={(e) => handleInputChange('shippingAddress.zipCode', e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                        placeholder="0100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Notes Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs sm:text-sm font-semibold">
                      3
                    </div>
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">Additional Notes</h2>
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </div>
                </div>
                <div className="p-5">
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all resize-none"
                    placeholder="Any special instructions for your order..."
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
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">Order Summary</h2>
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
                              No longer available
                            </p>
                          )}
                          {hasStockIssue && (
                            <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              {item.isOutOfStock ? 'Out of stock' : `Only ${item.availableStock} available`}
                            </p>
                          )}
                          {item.variant && !isUnavailable && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {Object.values(item.variant.options || {}).join(' / ')}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${hasStockIssue ? 'text-amber-600' : 'text-gray-500'}`}>
                              Qty: {item.quantity}
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
                    <span>Subtotal</span>
                    <span>₾{cart?.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>₾{cart?.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="px-5 py-4 border-t border-gray-100">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <CreditCardIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-amber-800">Demo Checkout</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        No real payment will be processed. Orders are auto-confirmed.
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
                        }`}>Cannot place order</p>
                        <p className={`text-xs mt-0.5 ${
                          cart.hasStockIssues && cart.unavailableCount === cart.stockIssueCount
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}>
                          {cart.hasStockIssues && cart.unavailableCount === cart.stockIssueCount
                            ? 'Some items have insufficient stock - reduce quantities or remove items'
                            : 'Remove unavailable items from your cart first'}
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
                        : 'bg-gray-800 text-white hover:bg-gray-700 hover:shadow-md'
                    }`}
                  >
                    {cart?.hasUnavailableItems ? 'Fix Cart Issues First' : 'Place Order'}
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
            <div className="w-20 h-20 mx-auto rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin"></div>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Processing Your Order</h2>
          <p className="text-xs sm:text-sm text-gray-600">Please wait while we confirm your order...</p>
        </div>
      )}

      {step === 'success' && (
        <div className="max-w-lg mx-auto py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Order Confirmed!</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            Thank you for your order. Your order number is:
          </p>
          <p className="text-base sm:text-lg font-bold text-gray-900 mb-6 font-mono bg-gray-100 inline-block px-4 py-2 rounded-lg">
            {orderNumber}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-8">
            You will receive a confirmation email shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-700 transition-all"
          >
            Continue Shopping
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

