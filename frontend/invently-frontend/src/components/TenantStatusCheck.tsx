import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface TenantStatusCheckProps {
  children: React.ReactNode;
}

/**
 * Component that checks if the current tenant exists.
 * Allows dashboard access even if tenant is inactive (for setup fee payment).
 * Only blocks access if tenant doesn't exist.
 */
const TenantStatusCheck: React.FC<TenantStatusCheckProps> = ({ children }) => {
  const { tenants, isLoading: authLoading } = useAuth();
  const [isChecking, setIsChecking] = React.useState(true);

  useEffect(() => {
    const checkTenantStatus = async () => {
      if (authLoading) return;

      const hostname = window.location.hostname;

      // 1. Check if hostname matches a tenant's custom domain
      const tenantByCustomDomain = tenants.find(
        t => t.customDomain && (
          t.customDomain === hostname ||
          t.customDomain === `www.${hostname}` ||
          t.customDomain === hostname.replace(/^www\./, '')
        )
      );
      if (tenantByCustomDomain) {
        setIsChecking(false);
        return;
      }

      // 2. Fall back to subdomain lookup (e.g. lashu.shopu.ge)
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

      const tenant = tenants.find(t => t.subdomain === subdomain);

      if (!tenant) {
        // No tenant found - redirect to main domain
        const mainDomain = hostname.includes('localhost')
          ? 'http://localhost:3000'
          : (hostname.endsWith('.shopu.ge') || hostname.endsWith('.momigvare.ge'))
            ? 'https://shopu.ge'
            : 'https://shopu.ge';
        window.location.href = `${mainDomain}/login`;
        return;
      }

      setIsChecking(false);
    };

    checkTenantStatus();
  }, [tenants, authLoading]);

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
