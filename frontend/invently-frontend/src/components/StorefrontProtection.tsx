import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface StorefrontProtectionProps {
  children: React.ReactNode;
}

/**
 * Component that protects storefront routes.
 * Blocks access if tenant is inactive or has no subscription.
 */
const StorefrontProtection: React.FC<StorefrontProtectionProps> = ({ children }) => {
  const { tenants, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = React.useState(true);

  useEffect(() => {
    const checkStorefrontAccess = async () => {
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
        // No tenant found - show 404 or redirect
        setIsChecking(false);
        return;
      }

      // Check if tenant is active (storefront requires active tenant)
      if (!tenant.isActive) {
        // Tenant is inactive - redirect to admin dashboard where they can pay setup fee
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // Tenant is active - allow storefront access
      setIsChecking(false);
    };

    checkStorefrontAccess();
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

export default StorefrontProtection;
