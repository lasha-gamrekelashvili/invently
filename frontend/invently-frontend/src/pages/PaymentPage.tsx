import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../utils/api';
import { useDashboardPath } from '../hooks/useDashboardPath';
import { useLanguage } from '../contexts/LanguageContext';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import { T } from '../components/Translation';
import { CreditCardIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PaymentPage = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { path } = useDashboardPath();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const successToastShownRef = useRef(false);

  const bogReturn = searchParams.get('bog');

  const pollPaymentStatus = useCallback(async () => {
    if (!paymentId) return;

    try {
      const paymentData = await paymentAPI.verifyPayment(paymentId);
      setPayment(paymentData);

      if (paymentData.status === 'PAID') {
        setIsPolling(false);
        if (!successToastShownRef.current) {
          successToastShownRef.current = true;
          handleSuccess(t('payment.successMessage'));
        }
        setTimeout(() => {
          window.location.href = window.location.origin + '/' + window.location.pathname.split('/')[1] + '/billing';
        }, 1500);
        return;
      }

      if (paymentData.status === 'FAILED') {
        setIsPolling(false);
        return;
      }

      pollCountRef.current += 1;
      if (pollCountRef.current < 10) {
        const delay = Math.min(2000 * Math.pow(1.5, pollCountRef.current - 1), 8000);
        pollTimerRef.current = setTimeout(pollPaymentStatus, delay);
      } else {
        setIsPolling(false);
      }
    } catch {
      setIsPolling(false);
    }
  }, [paymentId, t]);

  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) {
        setError('Payment ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const paymentData = await paymentAPI.getPayment(paymentId);
        setPayment(paymentData);

        if (paymentData.status === 'PAID') {
          if (!successToastShownRef.current) {
            successToastShownRef.current = true;
            handleSuccess(t('payment.successMessage'));
          }
          setTimeout(() => {
            window.location.href = window.location.origin + '/' + window.location.pathname.split('/')[1] + '/billing';
          }, 2000);
        } else if (bogReturn && paymentData.status === 'PENDING') {
          setIsPolling(true);
          pollCountRef.current = 0;
          pollTimerRef.current = setTimeout(pollPaymentStatus, 1000);
        }
      } catch (err: any) {
        const errorMessage = handleApiError(err, 'Failed to load payment information');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayment();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [paymentId, bogReturn, pollPaymentStatus, t]);

  const handleProcessPayment = async () => {
    if (!paymentId) return;

    setIsProcessing(true);
    setError('');

    try {
      const result = await paymentAPI.processPayment(paymentId);

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      setPayment(result);
      handleSuccess(t('payment.successMessage'));
      setTimeout(() => {
        window.location.href = window.location.origin + '/' + window.location.pathname.split('/')[1] + '/billing';
      }, 2000);
    } catch (err: any) {
      const errorMessage = handleApiError(err, 'Failed to process payment');
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircleIcon className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-900">Error</h2>
            </div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => navigate(path('dashboard'))}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = payment?.status === 'PAID';
  const isPending = payment?.status === 'PENDING';
  const amount = payment?.amount || 0;
  const paymentType = payment?.type === 'SETUP_FEE' ? 'Setup Fee' : 'Monthly Subscription';

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
              <CreditCardIcon className="h-8 w-8 text-neutral-600" />
            </div>
            <h1 className="text-3xl font-light text-neutral-900 mb-2">
              <T tKey="payment.title" />
            </h1>
            <p className="text-neutral-600">
              <T tKey="payment.subtitle" />
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-neutral-50 rounded-xl p-6 mb-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">
                  <T tKey="payment.type" />
                </span>
                <span className="font-medium text-neutral-900">{paymentType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">
                  <T tKey="payment.amount" />
                </span>
                <span className="text-2xl font-semibold text-neutral-900">
                  {amount.toFixed(2)} GEL
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">
                  <T tKey="payment.status" />
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPaid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isPaid ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                      <T tKey="payment.statusPaid" />
                    </>
                  ) : (
                    <T tKey="payment.statusPending" />
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Polling state — returning from BOG */}
          {isPolling && isPending && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3">
                <LoadingSpinner size="sm" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    <T tKey="payment.verifying" />
                  </h3>
                  <p className="text-sm text-blue-700">
                    <T tKey="payment.verifyingDescription" />
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed state after BOG return and verification */}
          {bogReturn && isPending && !isPolling && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">
                <T tKey="payment.bogFailed" />
              </p>
            </div>
          )}

          {/* Action Button */}
          {isPending && !isPolling && (
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="w-full bg-neutral-900 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <T tKey="payment.redirecting" />
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5" />
                  <T tKey="payment.processButton" />
                </>
              )}
            </button>
          )}

          {/* Payment failed */}
          {payment?.status === 'FAILED' && (
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-700">
                  <T tKey="payment.failedMessage" />
                </p>
              </div>
              <button
                onClick={() => navigate(path('billing'))}
                className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
              >
                <T tKey="payment.backToBilling" />
              </button>
            </div>
          )}

          {isPaid && (
            <div className="text-center">
              <p className="text-green-700 mb-4">
                <T tKey="payment.successMessage" />
              </p>
              <button
                onClick={() => navigate(path('billing'))}
                className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
              >
                <T tKey="payment.goToDashboard" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
