import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { T } from '../components/Translation';
import PageHeader from '../components/PageHeader';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const Billing = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError, refetch: refetchSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => paymentAPI.getSubscription(),
    retry: false,
  });

  // Always check for pending setup fee payment
  const { data: pendingSetupFee, isLoading: pendingSetupFeeLoading } = useQuery({
    queryKey: ['pendingSetupFee'],
    queryFn: () => paymentAPI.getPendingSetupFee(),
    retry: false,
    retryOnMount: false,
  });

  // Try to get tenant payments first
  const { data: payments, isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ['tenantPayments'],
    queryFn: () => paymentAPI.getTenantPayments(),
    retry: false,
  });

  // Fallback: try to get user payments if tenant payments fail (e.g., tenant inactive)
  const { data: userPayments, isLoading: userPaymentsLoading } = useQuery({
    queryKey: ['userPayments'],
    queryFn: () => paymentAPI.getUserPayments(),
    retry: false,
    enabled: !!paymentsError && (paymentsError as any)?.response?.status !== 200, // Only fetch if tenant payments failed
  });

  // Use tenant payments if available, otherwise fall back to user payments
  const displayPayments = payments || userPayments || [];
  const isLoadingPayments = paymentsLoading || (userPaymentsLoading && !!paymentsError);

  // Check if there's a paid setup fee but no subscription (edge case)
  const hasPaidSetupFee = displayPayments?.some((p: any) => p.type === 'SETUP_FEE' && p.status === 'PAID');
  const hasSubscription = !!subscription;

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => paymentAPI.cancelSubscription(),
    onSuccess: () => {
      handleSuccess(t('billing.subscriptionCancelled'));
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowCancelModal(false);
    },
    onError: (error) => {
      handleApiError(error, t('billing.cancelError'));
    },
  });

  const reactivateSubscriptionMutation = useMutation({
    mutationFn: () => paymentAPI.reactivateSubscription(),
    onSuccess: () => {
      handleSuccess(t('billing.subscriptionReactivated'));
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['tenantPayments'] });
      // Reload page to refresh auth context (tenant might have been reactivated)
      window.location.reload();
    },
    onError: (error) => {
      handleApiError(error, t('billing.reactivateError'));
    },
  });

  const getSubscriptionStatusLabel = (statusValue?: string) => {
    switch (statusValue) {
      case 'ACTIVE':
        return t('billing.status.active');
      case 'CANCELLED':
        return t('billing.status.cancelled');
      case 'EXPIRED':
        return t('billing.status.expired');
      case 'TRIAL':
        return t('billing.status.trial');
      default:
        return statusValue || '';
    }
  };

  const handleSetupPayment = async () => {
    setIsCreatingPayment(true);
    try {
      // Use cached pending setup fee if available, otherwise fetch it
      const paymentId = pendingSetupFee?.id || (await paymentAPI.getPendingSetupFee()).id;
      // Redirect to payment page
      navigate(`/payment/${paymentId}`);
    } catch (error) {
      handleApiError(error, t('billing.setupFeeError'));
      setIsCreatingPayment(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('billing.title')}
        subtitle={t('billing.subtitle')}
        icon={CreditCardIcon}
      />

      {subscriptionLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : subscription ? (
        <div className="space-y-4">
          {/* Subscription Overview */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-800">
                <T tKey="billing.subscriptionStatus" />
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                {getSubscriptionStatusLabel(subscription.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-neutral-100 md:divide-y-0 md:divide-x">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xs text-neutral-500 uppercase tracking-wide">
                  <T tKey="billing.monthlyFee" />
                </div>
                <div className="text-base font-semibold text-neutral-800">49.00 GEL</div>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xs text-neutral-500 uppercase tracking-wide flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
                  <T tKey="billing.nextBilling" />
                </div>
                <div className="text-sm font-medium text-neutral-800">
                  {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xs text-neutral-500 uppercase tracking-wide">
                  <T tKey="billing.currentPeriod" />
                </div>
                <div className="text-sm font-medium text-neutral-800 text-right">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            </div>

            {subscription.status === 'CANCELLED' && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="bg-white border border-neutral-200 rounded-md p-3">
                  <div className="flex items-start">
                    <ClockIcon className="h-5 w-5 text-neutral-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-800 mb-1">
                        <T tKey="billing.cancelledNotice" />
                      </div>
                      <div className="text-sm text-neutral-600 mb-3">
                        <T tKey="billing.accessUntil" />{' '}
                        <span className="font-medium">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                        . <T tKey="billing.noFurtherCharges" />
                      </div>
                      <button
                        onClick={() => reactivateSubscriptionMutation.mutate()}
                        disabled={reactivateSubscriptionMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 border border-neutral-900 rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reactivateSubscriptionMutation.isPending ? (
                          <span className="flex items-center">
                            <LoadingSpinner className="mr-2" />
                            <T tKey="billing.reactivating" />
                          </span>
                        ) : (
                          <T tKey="billing.reactivateSubscription" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {subscription.status === 'EXPIRED' && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="bg-white border border-neutral-200 rounded-md p-3">
                  <div className="flex items-start">
                    <XCircleIcon className="h-5 w-5 text-neutral-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-800 mb-1">
                        <T tKey="billing.expiredNotice" />
                      </div>
                      <div className="text-sm text-neutral-600 mb-3">
                        <T tKey="billing.expiredDescription" />
                      </div>
                      <button
                        onClick={() => reactivateSubscriptionMutation.mutate()}
                        disabled={reactivateSubscriptionMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 border border-neutral-900 rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reactivateSubscriptionMutation.isPending ? (
                          <span className="flex items-center">
                            <LoadingSpinner className="mr-2" />
                            <T tKey="billing.reactivating" />
                          </span>
                        ) : (
                          <T tKey="billing.reactivateSubscription" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {subscription.status === 'ACTIVE' && (
              <div className="mt-3 px-4 pb-4">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <T tKey="billing.cancelSubscription" />
                </button>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-800">
              <T tKey="billing.paymentHistory" />
              </h3>
            </div>

            {isLoadingPayments ? (
              <LoadingSpinner />
            ) : displayPayments && displayPayments.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {displayPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="col-span-7 flex items-center min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center mr-3">
                        <CreditCardIcon className="h-4 w-4 text-neutral-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-800 truncate">
                          {payment.type === 'SETUP_FEE' ? t('billing.setupFee') : t('billing.monthlySubscription')}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 truncate">
                          {new Date(payment.createdAt).toLocaleDateString()} • {payment.transactionId || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 text-right text-sm font-semibold text-neutral-800">
                      {payment.amount.toFixed(2)} GEL
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {payment.status === 'PAID' ? (
                        <span className="inline-flex items-center text-xs text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-full px-2 py-0.5">
                          <CheckCircleIcon className="h-3 w-3 mr-1 text-neutral-500" />
                          {payment.status}
                        </span>
                      ) : payment.status === 'FAILED' ? (
                        <span className="inline-flex items-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          <XCircleIcon className="h-3 w-3 mr-1 text-red-500" />
                          {payment.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-full px-2 py-0.5">
                          <ClockIcon className="h-3 w-3 mr-1 text-neutral-500" />
                          {payment.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-neutral-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <DocumentTextIcon className="h-6 w-6 text-neutral-400" />
                </div>
                <div className="text-sm font-medium text-neutral-900 mb-1">
                  <T tKey="billing.noPayments" />
                </div>
                <p className="text-neutral-500 text-xs">
                  <T tKey="billing.noPaymentsDescription" />
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show setup fee payment option if no subscription */}
          {!hasSubscription && !pendingSetupFeeLoading && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    <T tKey="billing.setupFee" />
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Complete your setup fee payment to activate your store and start selling.
                  </p>
                  <button
                    onClick={handleSetupPayment}
                    disabled={isCreatingPayment}
                    className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 border border-neutral-900 rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingPayment ? (
                      <span className="flex items-center">
                        <LoadingSpinner className="mr-2" />
                        <T tKey="billing.creatingPayment" />
                      </span>
                    ) : (
                      <T tKey="billing.paySetupFee" />
                    )}
                  </button>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-semibold text-neutral-900">1.00 GEL</div>
                  <div className="text-xs text-neutral-500 mt-1">One-time payment</div>
                </div>
              </div>
            </div>
          )}

          {/* Show payment status if setup fee was paid but no subscription */}
          {hasPaidSetupFee && !hasSubscription && subscriptionError && (subscriptionError as any)?.response?.status === 404 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ClockIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-yellow-900 mb-2">
                    <T tKey="billing.subscriptionPending" />
                  </h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    <T tKey="billing.subscriptionPendingDescription" />
                  </p>
                  <button
                    onClick={() => {
                      refetchSubscription();
                      queryClient.invalidateQueries({ queryKey: ['subscription'] });
                    }}
                    className="mt-3 px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    <T tKey="billing.retryActivation" />
                  </button>
                  <p className="text-xs text-yellow-600 mt-3">
                    <T tKey="billing.contactSupport" />
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment History - Show even if no subscription */}
          {displayPayments && displayPayments.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <h3 className="text-base font-medium text-neutral-900 mb-4">
                <T tKey="billing.paymentHistory" />
              </h3>
              <div className="space-y-2">
                {displayPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center mr-3">
                        <CreditCardIcon className="h-4 w-4 text-neutral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 truncate">
                          {payment.type === 'SETUP_FEE' ? t('billing.setupFee') : t('billing.monthlySubscription')}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 truncate">
                          {new Date(payment.createdAt).toLocaleDateString()} • {payment.transactionId || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-neutral-900">
                          {payment.amount.toFixed(2)} GEL
                        </div>
                        <div className="flex items-center justify-end mt-1">
                          {payment.status === 'PAID' ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              {payment.status}
                            </span>
                          ) : payment.status === 'FAILED' ? (
                            <span className="inline-flex items-center text-xs text-red-600">
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              {payment.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-yellow-600">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {payment.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Subscription Message */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
            <div className="bg-neutral-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <CreditCardIcon className="h-6 w-6 text-neutral-400" />
            </div>
            <div className="text-sm font-medium text-neutral-900 mb-1">
              <T tKey="billing.noSubscription" />
            </div>
            <p className="text-neutral-500 text-xs max-w-md mx-auto mb-4">
              <T tKey="billing.noSubscriptionDescription" />
            </p>
            <button
              onClick={handleSetupPayment}
              disabled={isCreatingPayment}
              className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 border border-neutral-900 rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingPayment ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner className="mr-2" />
                  <T tKey="billing.creatingPayment" />
                </span>
              ) : (
                <T tKey="billing.paySetupFee" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => cancelSubscriptionMutation.mutate()}
          title={t('billing.cancelSubscription')}
          message={t('billing.cancelConfirmation')}
          confirmText={t('billing.confirmCancel')}
          cancelText={t('common.cancel')}
          type="danger"
          isLoading={cancelSubscriptionMutation.isPending}
        />
      )}
    </div>
  );
};

export default Billing;
