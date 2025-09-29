import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isOnSubdomain } from '../utils/api';
import {
  ChartBarIcon,
  FolderIcon,
  CubeIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, tenants, logout } = useAuth();
  const location = useLocation();
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: ChartBarIcon, section: 'Store' },
    { name: 'Categories', href: '/admin/categories', icon: FolderIcon, section: 'Store' },
    { name: 'Products', href: '/admin/products', icon: CubeIcon, section: 'Store' },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon, section: 'Store' },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon, section: 'Store' },
    { name: 'Logs', href: '/admin/logs', icon: DocumentTextIcon, section: 'Store' },
  ];

  if (user?.role === 'PLATFORM_ADMIN') {
    navigation.push({ name: 'Platform Admin', href: '/admin/platform', icon: CogIcon, section: 'Admin' });
  }

  // Handle tenant resolution
  useEffect(() => {
    if (isOnSubdomain()) {
      // On subdomain, we need to get tenant info from the subdomain
      // This will be resolved by the backend based on the Host header
      const subdomain = window.location.hostname.split('.')[0];
      setCurrentTenant({ 
        name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + ' Store',
        subdomain: subdomain
      });
    } else {
      // On main domain, use the first tenant from context
      setCurrentTenant(tenants[0]);
    }
  }, [tenants]);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col h-screen ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <BuildingStorefrontIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {currentTenant?.name || 'Invently'}
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {/* Store Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Store</h3>
              <div className="space-y-1">
                {navigation.filter(item => item.section === 'Store').map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Admin Section */}
            {navigation.filter(item => item.section === 'Admin').length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Admin</h3>
                <div className="space-y-1">
                  {navigation.filter(item => item.section === 'Admin').map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User Menu - Always at bottom */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-xs font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>
            
            {/* View Store Link */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-3"
            >
              <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
              View Public Store
            </a>
            
            <button
              onClick={logout}
              className="flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile menu button */}
        <div className="lg:hidden flex-shrink-0 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
          <div className="px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Page content - scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;