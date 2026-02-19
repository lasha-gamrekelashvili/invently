import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTenantSlugFromPath } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

interface TenantStatusCheckProps {
  children: React.ReactNode;
}

/**
 * Component that checks if the current tenant exists and user has access.
 * Supports path-based dashboard (shopu.ge/:tenantSlug/dashboard).
 */
const TenantStatusCheck: React.FC<TenantStatusCheckProps> = ({ children }) => {
  const { tenants, isLoading: authLoading } = useAuth();
  const { tenantSlug: paramSlug } = useParams<{ tenantSlug: string }>();
  const [isChecking, setIsChecking] = React.useState(true);

  useEffect(() => {
    if (authLoading) return;

    const mainDomain = window.location.hostname.includes('localhost')
      ? `http://localhost${window.location.port ? `:${window.location.port}` : ''}`
      : 'https://shopu.ge';

    // Path-based dashboard: shopu.ge/:tenantSlug/dashboard
    const pathSlug = paramSlug ?? getTenantSlugFromPath();
    if (pathSlug) {
      const tenant = tenants.find((t) => t.subdomain === pathSlug);
      if (!tenant) {
        window.location.href = `${mainDomain}/${pathSlug}/login`;
        return;
      }
      setIsChecking(false);
      return;
    }

    setIsChecking(false);
  }, [tenants, authLoading, paramSlug]);

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
