import { useState } from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { T } from './Translation';
import LandingHeader from './LandingHeader';
import { getDashboardBasePath } from '../utils/api';
import {
  ChartBarIcon,
  FolderIcon,
  CubeIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  ShoppingBagIcon,
  ArrowUpTrayIcon,
  CreditCardIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const base = tenantSlug ? getDashboardBasePath(tenantSlug) : '/admin';
  const navigation = [
    { name: t('navigation.dashboard'), href: `${base}/dashboard`, icon: ChartBarIcon, section: 'Store' },
    { name: t('navigation.categories'), href: `${base}/categories`, icon: FolderIcon, section: 'Store' },
    { name: t('navigation.products'), href: `${base}/products`, icon: CubeIcon, section: 'Store' },
    { name: t('navigation.bulkUpload'), href: `${base}/bulk-upload`, icon: ArrowUpTrayIcon, section: 'Store' },
    { name: t('navigation.orders'), href: `${base}/orders`, icon: ShoppingBagIcon, section: 'Store' },
    { name: t('navigation.appearance'), href: `${base}/appearance`, icon: PaintBrushIcon, section: 'Store' },
    { name: t('navigation.billing'), href: `${base}/billing`, icon: CreditCardIcon, section: 'Store' },
    { name: t('navigation.settings'), href: `${base}/settings`, icon: CogIcon, section: 'Store' },
  ];

  if (user?.role === 'PLATFORM_ADMIN') {
    navigation.push({ name: t('navigation.admin'), href: `${base}/platform`, icon: CogIcon, section: 'Admin' });
  }

  return (
    <div className="h-screen bg-neutral-50 flex flex-col overflow-hidden">
      {/* Top Header - Full Width */}
      <div className="flex-shrink-0 z-50">
        <LandingHeader 
          showAuthButtons={false}
          mobileMenuButton={
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
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
            className="fixed inset-0 z-40 bg-neutral-900 bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed top-14 sm:top-16 md:top-20 bottom-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-neutral-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:top-auto lg:w-64 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col flex-1 min-h-0">
          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {/* Store Section */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
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
                          ? 'bg-neutral-100 text-neutral-900' 
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
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
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
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
                            ? 'bg-neutral-100 text-neutral-900' 
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
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
          <div className="p-4 border-t border-neutral-200 flex-shrink-0">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center mr-3">
                <span className="text-xs font-medium text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-neutral-900 text-sm">
                  {tenantSlug?.toUpperCase() || user?.email}
                </div>
                <div className="text-xs text-neutral-500">{user?.role}</div>
              </div>
            </div>
            
            
            {/* View Store Link - on main domain use subdomain for storefront */}
            <a
              href={tenantSlug ? (window.location.hostname.includes('localhost') ? `http://${tenantSlug}.localhost:3000/` : `https://${tenantSlug}.shopu.ge/`) : '/'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-neutral-900 hover:text-neutral-700 transition-colors mb-3"
            >
              <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
              <T tKey="navigation.storefront" />
            </a>
            
            <button
              onClick={logout}
              className="flex items-center text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
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