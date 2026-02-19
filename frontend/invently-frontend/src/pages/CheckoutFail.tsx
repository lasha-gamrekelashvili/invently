import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { XCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { storefrontAPI } from '../utils/api';

const CheckoutFail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const returnTo = searchParams.get('returnTo');

  const goToStore = () => {
    if (returnTo) {
      window.location.href = returnTo;
    } else {
      window.location.href = '/';
    }
  };

  const goToCheckout = () => {
    if (returnTo) {
      window.location.href = `${returnTo.replace(/\/$/, '')}/checkout`;
    } else {
      navigate('/checkout');
    }
  };

  const { data: failureDetails, isLoading } = useQuery({
    queryKey: ['payment-failure-details', orderId],
    queryFn: () => storefrontAPI.getPaymentFailureDetails(orderId!),
    enabled: !!orderId,
    retry: false,
  });

  React.useEffect(() => {
    if (failureDetails?.order_status === 'completed' && orderId) {
      const params = new URLSearchParams({ orderId });
      if (returnTo) params.set('returnTo', returnTo);
      navigate(`/checkout/success?${params.toString()}`, { replace: true });
    }
  }, [failureDetails?.order_status, orderId, navigate]);

  // Show loading while we check if payment actually succeeded (BOG can redirect here even on success)
  if (orderId && (isLoading || failureDetails?.order_status === 'completed')) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-neutral-200 border-t-neutral-800 animate-spin" />
          <p className="text-neutral-600 text-sm">Verifying payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <XCircleIcon className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-light tracking-tight text-neutral-900 mb-3">
          Payment was not completed
        </h2>
        <p className="text-sm text-neutral-600 mb-6">
          Your payment could not be processed. Your order has not been charged. You can try again by returning to the checkout.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={goToCheckout}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 text-white text-sm font-medium rounded-full hover:bg-neutral-700"
          >
            Try again
          </button>
          <button
            onClick={goToStore}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-full hover:bg-neutral-50"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Back to store
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFail;
