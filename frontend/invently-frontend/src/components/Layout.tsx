import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isOnSubdomain } from '../utils/api';
import { T } from './Translation';
import LandingHeader from './LandingHeader';
import {
  ChartBarIcon,
  FolderIcon,
  CubeIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, tenants, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: t('navigation.dashboard'), href: '/admin/dashboard', icon: ChartBarIcon, section: 'Store' },
    { name: t('navigation.categories'), href: '/admin/categories', icon: FolderIcon, section: 'Store' },
    { name: t('navigation.products'), href: '/admin/products', icon: CubeIcon, section: 'Store' },
    { name: t('navigation.orders'), href: '/admin/orders', icon: ShoppingBagIcon, section: 'Store' },
    { name: t('navigation.settings'), href: '/admin/settings', icon: CogIcon, section: 'Store' },
  ];

  if (user?.role === 'PLATFORM_ADMIN') {
    navigation.push({ name: t('navigation.admin'), href: '/admin/platform', icon: CogIcon, section: 'Admin' });
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Header - Full Width */}
      <div className="flex-shrink-0 z-50">
        <LandingHeader 
          showAuthButtons={false}
          shopName={currentTenant?.subdomain || currentTenant?.name || ''}
          mobileMenuButton={
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          }
        />
      </div>

      {/* Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed top-14 sm:top-16 md:top-20 bottom-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:top-auto lg:w-64 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col flex-1 min-h-0">
          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {/* Store Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <T tKey="navigation.storefront" />
              </h3>
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
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  <T tKey="navigation.admin" />
                </h3>
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
              <T tKey="navigation.storefront" />
            </a>
            
            <button
              onClick={logout}
              className="flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              <T tKey="navigation.logout" />
            </button>
          </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page content - scrollable */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;