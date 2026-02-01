import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
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
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError, refetch: refetchSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => paymentAPI.getSubscription(),
    retry: false,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('billing.title')}
        subtitle={t('billing.subtitle')}
        icon={CreditCardIcon}
      />

      {subscriptionLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : subscription ? (
        <div className="space-y-6">
          {/* Subscription Overview */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-neutral-900">
                <T tKey="billing.subscriptionStatus" />
              </h3>
              <StatusBadge
                status={subscription.status}
                type="subscription"
                showIcon={true}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <div className="text-sm text-neutral-600 mb-1">
                  <T tKey="billing.monthlyFee" />
                </div>
                <div className="text-2xl font-semibold text-neutral-900">49.00 GEL</div>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <div className="text-sm text-neutral-600 mb-1 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <T tKey="billing.nextBilling" />
                </div>
                <div className="text-lg font-medium text-neutral-900">
                  {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </div>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <div className="text-sm text-neutral-600 mb-1">
                  <T tKey="billing.currentPeriod" />
                </div>
                <div className="text-sm font-medium text-neutral-900">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            </div>

            {subscription.status === 'CANCELLED' && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start">
                    <ClockIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-yellow-900 mb-1">
                        <T tKey="billing.cancelledNotice" />
                      </div>
                      <div className="text-sm text-yellow-700">
                        <T tKey="billing.accessUntil" />{' '}
                        <span className="font-medium">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                        . <T tKey="billing.noFurtherCharges" />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => reactivateSubscriptionMutation.mutate()}
                  disabled={reactivateSubscriptionMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-700 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}

            {subscription.status === 'EXPIRED' && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start">
                    <XCircleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-red-900 mb-1">
                        <T tKey="billing.expiredNotice" />
                      </div>
                      <div className="text-sm text-red-700">
                        <T tKey="billing.expiredDescription" />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => reactivateSubscriptionMutation.mutate()}
                  disabled={reactivateSubscriptionMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-700 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}

            {subscription.status === 'ACTIVE' && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <T tKey="billing.cancelSubscription" />
                </button>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h3 className="text-xl font-light text-neutral-900 mb-6">
              <T tKey="billing.paymentHistory" />
            </h3>

            {isLoadingPayments ? (
              <LoadingSpinner />
            ) : displayPayments && displayPayments.length > 0 ? (
              <div className="space-y-3">
                {displayPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center mr-4">
                        <CreditCardIcon className="h-5 w-5 text-neutral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900">
                          {payment.type === 'SETUP_FEE' ? t('billing.setupFee') : t('billing.monthlySubscription')}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {new Date(payment.createdAt).toLocaleDateString()} • {payment.transactionId || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-neutral-900">
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
            ) : (
              <div className="text-center py-12">
                <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-neutral-400" />
                </div>
                <div className="text-lg font-light text-neutral-900 mb-2">
                  <T tKey="billing.noPayments" />
                </div>
                <p className="text-neutral-500 text-sm">
                  <T tKey="billing.noPaymentsDescription" />
                </p>
              </div>
            )}
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h3 className="text-xl font-light text-neutral-900 mb-6">
              <T tKey="billing.accountInfo" />
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <T tKey="billing.iban" />
                </label>
                <div className="text-sm text-neutral-900 font-mono bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
                  {user?.iban || (
                    <span className="text-neutral-400 italic">
                      <T tKey="billing.noIban" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <Link
                to="/admin/settings?tab=account"
                className="inline-flex items-center text-sm font-medium text-neutral-900 hover:text-neutral-700 transition-colors"
              >
                <T tKey="billing.manageAccount" /> →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Show payment status if setup fee was paid but no subscription */}
          {hasPaidSetupFee && !hasSubscription && subscriptionError && (subscriptionError as any)?.response?.status === 404 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
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
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="text-xl font-light text-neutral-900 mb-6">
                <T tKey="billing.paymentHistory" />
              </h3>
              <div className="space-y-3">
                {displayPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center mr-4">
                        <CreditCardIcon className="h-5 w-5 text-neutral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900">
                          {payment.type === 'SETUP_FEE' ? t('billing.setupFee') : t('billing.monthlySubscription')}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {new Date(payment.createdAt).toLocaleDateString()} • {payment.transactionId || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-neutral-900">
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
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <div className="bg-neutral-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="h-10 w-10 text-neutral-400" />
            </div>
            <div className="text-lg font-light text-neutral-900 mb-2">
              <T tKey="billing.noSubscription" />
            </div>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">
              <T tKey="billing.noSubscriptionDescription" />
            </p>
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
