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

      const hostname = window.location.hostname;

      // 1. Check if hostname matches a tenant's custom domain (commercia.ge, www.commercia.ge)
      let tenant = tenants.find(
        t => t.customDomain && (
          t.customDomain === hostname ||
          t.customDomain === `www.${hostname}` ||
          t.customDomain === hostname.replace(/^www\./, '')
        )
      );

      // 2. Fall back to subdomain lookup (e.g. lashu.shopu.ge)
      if (!tenant) {
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
        tenant = subdomain ? tenants.find(t => t.subdomain === subdomain) : undefined;
      }

      if (!tenant) {
        setIsChecking(false);
        return;
      }

      if (!tenant) {
        // No tenant found - show 404 or redirect
        setIsChecking(false);
        return;
      }

      // Tenant inactive - redirect to dashboard (owner can renew)
      if (!tenant.isActive) {
        const baseUrl = hostname.includes('localhost')
          ? `http://localhost${window.location.port ? `:${window.location.port}` : ''}`
          : 'https://shopu.ge';
        window.location.href = `${baseUrl}/${tenant.id}/dashboard`;
        return;
      }

      // Tenant active - allow
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
