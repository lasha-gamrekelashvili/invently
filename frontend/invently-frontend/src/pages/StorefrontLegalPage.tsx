import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontAPI } from '../utils/api';
import { CartProvider } from '../contexts/CartContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import StorefrontHeader from '../components/StorefrontHeader';
import StorefrontFooter from '../components/StorefrontFooter';
import Cart from '../components/Cart';
import LoadingSpinner from '../components/LoadingSpinner';
import TenantNotFound from '../components/TenantNotFound';
import { T } from '../components/Translation';
import { useLanguage } from '../contexts/LanguageContext';

type StoreContentSettingKey = 'aboutUs' | 'privacyPolicy' | 'termsOfService' | 'shippingInfo' | 'returns' | 'faq';

const pathToSettingKey: Record<string, StoreContentSettingKey> = {
  'about': 'aboutUs',
  'privacy': 'privacyPolicy',
  'terms': 'termsOfService',
  'shipping': 'shippingInfo',
  'returns': 'returns',
  'faq': 'faq',
};

const pageTitles: Record<string, string> = {
  about: 'About Us',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  shipping: 'Shipping Info',
  returns: 'Returns',
  faq: 'FAQ',
};

const StorefrontLegalContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showCart, setShowCart] = useState(false);
  const [cartClosing, setCartClosing] = useState(false);
  const pageKey = location.pathname.replace('/', '') || 'about';
  const settingKey = pathToSettingKey[pageKey];

  const handleCartToggle = () => {
    if (showCart && !cartClosing) setCartClosing(true);
    else if (!showCart) {
      setShowCart(true);
      setCartClosing(false);
    }
  };

  const { data: storeInfo, error: storeInfoError, isLoading: storeInfoLoading } = useQuery({
    queryKey: ['store-info'],
    queryFn: () => storefrontAPI.getStoreInfo(),
    retry: false,
  });

  const { data: storeSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => storefrontAPI.getSettings(),
    retry: false,
  });

  const content = settingKey && storeSettings?.[settingKey]?.content;

  if (storeInfoLoading || settingsLoading || storeInfoError || !storeInfo) {
    if (storeInfoError || !storeInfo) return <TenantNotFound />;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!settingKey || !content) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-light text-neutral-900 mb-4">
          <T tKey="legal.notFound.title" />
        </h1>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          {t('storefront.checkout.goBack')}
        </button>
      </div>
    );
  }

  const navLinks = [
    ...(storeSettings?.aboutUs?.content ? [{ path: '/about', label: 'About Us' }] : []),
    ...(storeSettings?.privacyPolicy?.content ? [{ path: '/privacy', label: 'Privacy Policy' }] : []),
    ...(storeSettings?.termsOfService?.content ? [{ path: '/terms', label: 'Terms of Service' }] : []),
    ...(storeSettings?.shippingInfo?.content ? [{ path: '/shipping', label: 'Shipping Info' }] : []),
    ...(storeSettings?.returns?.content ? [{ path: '/returns', label: 'Returns' }] : []),
    ...(storeSettings?.faq?.content ? [{ path: '/faq', label: 'FAQ' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StorefrontHeader
        storeInfo={storeInfo}
        onMenuClick={() => {}}
        onCartClick={handleCartToggle}
        searchQuery=""
        isCartOpen={showCart}
        isSidebarOpen={false}
        storeSettings={storeSettings}
      />

      {showCart && (
        <Cart
          onClose={() => { setShowCart(false); setCartClosing(false); }}
          isClosing={cartClosing}
        />
      )}

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16">
          <div className="grid lg:grid-cols-4 gap-12">
            <aside className="lg:col-span-1">
              <nav className="sticky top-20">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  {t('storefront.checkout.goBack')}
                </button>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-6">
                  <T tKey="legal.nav.title" />
                </h3>
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          location.pathname === link.path
                            ? 'bg-neutral-100 text-neutral-900 font-medium'
                            : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            <main className="lg:col-span-3">
              <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-8 tracking-tight leading-[1.1]">
                {pageTitles[pageKey] || pageTitles.about}
              </h1>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-base text-neutral-600 leading-relaxed">
                  {content}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      <StorefrontFooter
        settings={storeSettings}
        footerBackgroundColor={storeSettings?.footerBackgroundColor}
        footerTextColor={storeSettings?.footerTextColor}
        footerHeadingColor={storeSettings?.footerHeadingColor}
        footerLinkColor={storeSettings?.footerLinkColor}
      />
    </div>
  );
};

const StorefrontLegalPage: React.FC = () => {
  return (
    <CartProvider>
      <StorefrontLegalContent />
    </CartProvider>
  );
};

export default StorefrontLegalPage;
