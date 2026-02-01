import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import { T } from '../components/Translation';
import { CreditCardIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PaymentPage = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

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

        // If payment is already paid, redirect to dashboard
        if (paymentData.status === 'PAID') {
          handleSuccess('Payment already processed!');
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 2000);
        }
      } catch (err: any) {
        const errorMessage = handleApiError(err, 'Failed to load payment information');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayment();
  }, [paymentId, navigate]);

  const handleProcessPayment = async () => {
    if (!paymentId) return;

    setIsProcessing(true);
    setError('');

    try {
      const updatedPayment = await paymentAPI.processPayment(paymentId);
      setPayment(updatedPayment);

      handleSuccess('Payment processed successfully!');
      
      // Refresh auth context to get updated tenant status
      window.location.reload();
      
      // Redirect to dashboard after successful payment
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
    } catch (err: any) {
      const errorMessage = handleApiError(err, 'Failed to process payment');
      setError(errorMessage);
    } finally {
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
              onClick={() => navigate('/admin/dashboard')}
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

          {/* Payment Instructions */}
          {isPending && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                <T tKey="payment.instructions" />
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                <T tKey="payment.mockPaymentNote" />
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                <li><T tKey="payment.step1" /></li>
                <li><T tKey="payment.step2" /></li>
                <li><T tKey="payment.step3" /></li>
              </ul>
            </div>
          )}

          {/* Action Button */}
          {isPending && (
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="w-full bg-neutral-900 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <T tKey="payment.processing" />
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5" />
                  <T tKey="payment.processButton" />
                </>
              )}
            </button>
          )}

          {isPaid && (
            <div className="text-center">
              <p className="text-green-700 mb-4">
                <T tKey="payment.successMessage" />
              </p>
              <button
                onClick={() => navigate('/admin/dashboard')}
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
