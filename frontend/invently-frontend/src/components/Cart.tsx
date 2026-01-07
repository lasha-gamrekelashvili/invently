import { useCart } from '../contexts/CartContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface CartProps {
  onClose: () => void;
  isClosing?: boolean;
}

const Cart: React.FC<CartProps> = ({ onClose, isClosing = false }) => {
  const navigate = useNavigate();
  const {
    cart,
    isLoading,
    updateCartItem,
    removeFromCart,
    clearCart,
    cartTotal,
  } = useCart();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation
    setIsVisible(true);
  }, []);

  // Watch for isClosing prop to trigger close animation
  useEffect(() => {
    if (isClosing) {
      setIsVisible(false);
      // Wait for animation to complete before calling onClose
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  // Prevent background scroll when cart is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleQuantityChange = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateCartItem(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    handleClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 z-40"
        onClick={handleClose}
      />

      {/* Cart Panel */}
      <div className={`fixed right-0 top-14 sm:top-16 md:top-20 bottom-0 w-full sm:w-[450px] bg-white shadow-2xl border-t border-gray-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-700 border-t-transparent"></div>
            </div>
          ) : cart?.items && cart.items.length > 0 ? (
            <div className="space-y-4">
              {cart.items.map((item) => {
                const isUnavailable = item.isAvailable === false;
                const isProductGone = item.product?.isDeleted || !item.product?.isActive || !item.product;
                const hasStockIssue = !isProductGone && (item.isOutOfStock || !item.hasEnoughStock);
                const canAdjustQuantity = !isProductGone && (item.availableStock ?? 0) > 0;
                
                return (
                  <div
                    key={item.id}
                    className={`bg-gradient-to-br rounded-xl p-4 border transition-shadow ${
                      isProductGone 
                        ? 'from-red-50 to-red-100 border-red-300 opacity-75'
                        : hasStockIssue
                          ? 'from-amber-50 to-orange-50 border-amber-300'
                          : 'from-gray-50 to-white border-gray-200 hover:shadow-md'
                    }`}
                  >
                    {/* Warning Banner - different colors for different issues */}
                    {isUnavailable && (
                      <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg border ${
                        isProductGone 
                          ? 'bg-red-100 border-red-200' 
                          : 'bg-amber-100 border-amber-200'
                      }`}>
                        <ExclamationTriangleIcon className={`h-5 w-5 flex-shrink-0 ${
                          isProductGone ? 'text-red-600' : 'text-amber-600'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isProductGone ? 'text-red-700' : 'text-amber-700'
                        }`}>
                          {item.unavailableReason || 'This product is no longer available'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className={`w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden ${isProductGone ? 'grayscale' : ''}`}>
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm mb-1 line-clamp-2 ${isProductGone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.product.title}
                        </h3>
                        {item.variant && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {Object.entries(item.variant.options).map(([key, value]) => (
                              <span
                                key={key}
                                className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded"
                              >
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className={`text-sm ${isProductGone ? 'text-gray-400' : 'text-gray-600'}`}>
                          ${item.price.toFixed(2)} each
                        </p>
                        
                        {/* Stock indicator for items with stock issues */}
                        {hasStockIssue && !item.isOutOfStock && (
                          <p className="text-xs text-amber-600 font-medium mt-1">
                            Only {item.availableStock} in stock
                          </p>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3 mt-3">
                          {/* Show quantity controls if product exists and has some stock */}
                          {canAdjustQuantity && (
                            <div className={`flex items-center bg-white border rounded-lg ${
                              hasStockIssue ? 'border-amber-300' : 'border-gray-300'
                            }`}>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-l-lg transition-colors"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className={`px-4 py-2 text-sm font-semibold border-x ${
                                hasStockIssue 
                                  ? 'text-amber-700 border-amber-300' 
                                  : 'text-gray-900 border-gray-300'
                              }`}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                disabled={item.quantity >= (item.availableStock ?? 0)}
                                className={`p-2 rounded-r-lg transition-colors ${
                                  item.quantity >= (item.availableStock ?? 0)
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isUnavailable 
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-100 font-medium' 
                                : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            aria-label="Remove item"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isUnavailable ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCartIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600">Add some products to get started!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart?.items && cart.items.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
            {/* Stock Issues Warning */}
            {cart.hasStockIssues && !cart.hasUnavailableItems && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {cart.stockIssueCount === 1 
                      ? '1 item has insufficient stock' 
                      : `${cart.stockIssueCount} items have insufficient stock`}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Reduce quantities or remove items to continue
                  </p>
                </div>
              </div>
            )}

            {/* Unavailable Items Warning (deleted/inactive products) */}
            {cart.hasUnavailableItems && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {cart.unavailableCount === 1 
                      ? '1 item in your cart is unavailable' 
                      : `${cart.unavailableCount} items in your cart are unavailable`}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {cart.hasStockIssues 
                      ? 'Remove unavailable items and fix stock issues before checkout'
                      : 'Please remove unavailable items before checkout'}
                  </p>
                </div>
              </div>
            )}

            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-300">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleCheckout}
                disabled={cart.hasUnavailableItems}
                className={`w-full py-4 px-4 rounded-xl font-semibold transition-all shadow-lg ${
                  cart.hasUnavailableItems
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:from-gray-700 hover:to-gray-600 hover:shadow-xl active:scale-95'
                }`}
              >
                {cart.hasUnavailableItems ? 'Remove Unavailable Items to Checkout' : 'Proceed to Checkout'}
              </button>
              <button
                onClick={clearCart}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;