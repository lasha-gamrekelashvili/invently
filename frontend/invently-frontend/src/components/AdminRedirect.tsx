import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCurrentSubdomain } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Redirects /admin/* on subdomain/custom domain to shopu.ge/:tenantSlug/dashboard path
 */
const AdminRedirect = () => {
  const location = useLocation();
  const { tenants } = useAuth();

  useEffect(() => {
    const hostname = window.location.hostname;

    let subdomain = getCurrentSubdomain();

    if (!subdomain) {
      const tenant = tenants.find(
        (t) =>
          t.customDomain &&
          (t.customDomain === hostname ||
            t.customDomain === `www.${hostname}` ||
            t.customDomain === hostname.replace(/^www\./, ''))
      );
      subdomain = tenant?.subdomain ?? null;
    }

    const baseUrl =
      hostname.includes('localhost') || hostname === '127.0.0.1'
        ? `http://localhost${window.location.port ? `:${window.location.port}` : ''}`
        : 'https://shopu.ge';

    if (subdomain) {
      const adminPath = location.pathname.replace(/^\/admin\/?/, '') || 'dashboard';
      const newPath = `/${subdomain}/${adminPath}`.replace(/\/+/g, '/');
      window.location.replace(`${baseUrl}${newPath}${location.search}${location.hash}`);
    } else {
      window.location.replace(`${baseUrl}/login`);
    }
  }, [location, tenants]);

  return null;
};

export default AdminRedirect;
