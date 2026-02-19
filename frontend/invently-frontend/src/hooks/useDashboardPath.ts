import { useParams } from 'react-router-dom';
import { getDashboardBasePath } from '../utils/api';

/**
 * Returns the dashboard base path (e.g. /commercia) for building navigation links.
 */
export const useDashboardPath = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const base = tenantSlug ? getDashboardBasePath(tenantSlug) : '/admin';
  return {
    base,
    path: (segment: string) => `${base}/${segment}`.replace(/\/+/g, '/'),
    tenantSlug: tenantSlug ?? null,
  };
};
