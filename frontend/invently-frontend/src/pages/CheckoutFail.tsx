import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { XCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { storefrontAPI } from '../utils/api';

const CheckoutFail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: failureDetails } = useQuery({
    queryKey: ['payment-failure-details', orderId],
    queryFn: () => storefrontAPI.getPaymentFailureDetails(orderId!),
    enabled: !!orderId,
    retry: false,
  });

  // BOG sometimes redirects to fail even when payment succeeded; redirect to success if BOG says completed
  React.useEffect(() => {
    if (failureDetails?.order_status === 'completed' && orderId) {
      navigate(`/checkout/success?orderId=${orderId}`, { replace: true });
    }
  }, [failureDetails?.order_status, orderId, navigate]);

  const reason =
    failureDetails?.reject_reason ??
    failureDetails?.code_description ??
    (failureDetails?.payment_code != null ? `(code: ${failureDetails.payment_code})` : null);

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
        {reason && (
          <p className="text-sm text-red-700/90 mb-4 rounded-lg bg-red-50 px-4 py-2 font-medium">
            Reason: {reason}
          </p>
        )}
        {orderId && (
          <p className="text-xs text-neutral-500 mb-4 font-mono">
            Order ID: {orderId}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/checkout')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 text-white text-sm font-medium rounded-full hover:bg-neutral-700"
          >
            Try again
          </button>
          <button
            onClick={() => navigate('/')}
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
