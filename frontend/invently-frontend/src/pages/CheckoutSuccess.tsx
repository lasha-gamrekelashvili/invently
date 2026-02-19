import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '../utils/api';
import {
  CheckCircleIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => storefrontAPI.getOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const data = query.state.data as { paymentStatus?: string } | undefined;
      if (data?.paymentStatus === 'PAID') return false;
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

  if (!orderId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-light text-neutral-900 mb-2">Invalid link</h2>
          <p className="text-neutral-600 mb-6">No order ID provided.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 text-white rounded-full hover:bg-neutral-700"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Back to store
          </button>
        </div>
      </div>
    );
  }

  const isPaid = order?.paymentStatus === 'PAID';

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {isLoading && !order ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-neutral-200 border-t-neutral-800 animate-spin" />
            <p className="text-neutral-600">Confirming your payment...</p>
          </div>
        ) : isPaid ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-neutral-900 mb-3">
              Thank you for your order!
            </h2>
            <p className="text-sm text-neutral-600 mb-2">Your order number is:</p>
            <p className="text-base sm:text-lg font-medium text-neutral-900 mb-6 font-mono bg-neutral-100 inline-block px-4 py-2 rounded-lg">
              {(order as { orderNumber?: string })?.orderNumber || orderId}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 mb-8">
              You will receive a confirmation email shortly.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 text-white text-sm font-medium rounded-full hover:bg-neutral-700"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              Continue shopping
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-light text-neutral-900 mb-3">Payment pending</h2>
            <p className="text-sm text-neutral-600 mb-6">
              We are still confirming your payment. This usually takes a few seconds. Please refresh in a moment.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 text-white text-sm font-medium rounded-full hover:bg-neutral-700"
            >
              Refresh
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
