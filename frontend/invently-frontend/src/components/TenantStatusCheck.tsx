import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { paymentAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

interface TenantStatusCheckProps {
  children: React.ReactNode;
}

/**
 * Component that checks if the current tenant is active.
 * If inactive, redirects to payment page if there's a pending payment.
 */
const TenantStatusCheck: React.FC<TenantStatusCheckProps> = ({ children }) => {
  const { tenants, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = React.useState(true);

  useEffect(() => {
    const checkTenantStatus = async () => {
      if (authLoading) return;

      // Get current tenant from subdomain
      const hostname = window.location.hostname;
      let subdomain = '';
      
      if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[0] !== 'localhost') {
          subdomain = parts[0];
        }
      } else {
        const parts = hostname.split('.');
        if (parts.length > 2) {
          subdomain = parts[0];
        }
      }

      if (!subdomain) {
        setIsChecking(false);
        return;
      }

      // Find tenant by subdomain
      const tenant = tenants.find(t => t.subdomain === subdomain);

      if (!tenant) {
        // No tenant found - redirect to main domain
        const mainDomain = hostname.includes('localhost')
          ? 'http://localhost:3000'
          : `https://${hostname.split('.').slice(1).join('.')}`;
        window.location.href = `${mainDomain}/login`;
        return;
      }

      // If tenant is inactive, check for pending payment or expired subscription
      if (!tenant.isActive) {
        try {
          // Check if subscription exists and is expired (allow access to billing page for reactivation)
          try {
            const subscription = await paymentAPI.getSubscription();
            if (subscription && subscription.status === 'EXPIRED') {
              // Allow access to billing page for reactivation
              setIsChecking(false);
              return;
            }
          } catch (subError: any) {
            // Subscription not found - could be old tenant without subscription
            // Check if error indicates subscription required
            if (subError?.response?.data?.needsSetupFee || subError?.response?.data?.subscriptionRequired) {
              // Old tenant needs to pay setup fee
              try {
                const pendingSetupFee = await paymentAPI.getPendingSetupFee();
                if (pendingSetupFee) {
                  navigate(`/payment/${pendingSetupFee.id}`, { replace: true });
                  return;
                }
              } catch (paymentError) {
                // No pending payment - redirect to login
                const mainDomain = hostname.includes('localhost')
                  ? 'http://localhost:3000'
                  : `https://${hostname.split('.').slice(1).join('.')}`;
                window.location.href = `${mainDomain}/login`;
                return;
              }
            }
          }

          // Get pending setup fee payment
          const pendingSetupFee = await paymentAPI.getPendingSetupFee();

          if (pendingSetupFee) {
            // Redirect to payment page
            navigate(`/payment/${pendingSetupFee.id}`, { replace: true });
            return;
          } else {
            // No pending payment but tenant is inactive - show error
            // This shouldn't happen normally, but handle it gracefully
            console.error('Tenant is inactive but no pending payment found');
            // Still redirect to payment page or show error
            // For now, redirect to main domain login
            const mainDomain = hostname.includes('localhost')
              ? 'http://localhost:3000'
              : `https://${hostname.split('.').slice(1).join('.')}`;
            window.location.href = `${mainDomain}/login`;
            return;
          }
        } catch (error: any) {
          // If error checking payments, don't allow access
          console.error('Error checking tenant payment status:', error);
          // Redirect to main domain login
          const mainDomain = hostname.includes('localhost')
            ? 'http://localhost:3000'
            : `https://${hostname.split('.').slice(1).join('.')}`;
          window.location.href = `${mainDomain}/login`;
          return;
        }
      }

      // Tenant is active - allow access
      setIsChecking(false);
    };

    checkTenantStatus();
  }, [tenants, authLoading, navigate]);

  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};

export default TenantStatusCheck;
