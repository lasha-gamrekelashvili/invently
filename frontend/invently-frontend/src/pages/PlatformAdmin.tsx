import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PlatformAdmin = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats(),
  });

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: () => adminAPI.getTenants({ limit: 10 }),
  });

  if (statsLoading || tenantsLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform Administration</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">
            {stats?.stats.totalTenants || 0}
          </div>
          <div className="text-sm text-gray-600">Total Shops</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">
            {stats?.stats.activeTenants || 0}
          </div>
          <div className="text-sm text-gray-600">Active Shops</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">
            {stats?.stats.totalUsers || 0}
          </div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">
            {stats?.stats.totalProducts || 0}
          </div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Shops</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {tenantsData?.tenants?.map((tenant) => (
            <div key={tenant.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{tenant.name}</div>
                <div className="text-sm text-gray-500">
                  {tenant.subdomain}.example.com • {tenant.owner?.email}
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  tenant.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlatformAdmin;