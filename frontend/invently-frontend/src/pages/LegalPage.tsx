import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LandingHeader from '../components/LandingHeader';
import { T } from '../components/Translation';
import { useLanguage } from '../contexts/LanguageContext';

// Map URL paths to translation keys (kebab-case to camelCase)
const pathToTranslationKey: Record<string, string> = {
  'about': 'about',
  'contact': 'contact',
  'services': 'services',
  'pricing': 'pricing',
  'terms': 'terms',
  'privacy': 'privacy',
  'refund-policy': 'refundPolicy',
};

// Navigation links for sidebar - now uses translation keys
const navLinks = [
  { path: '/about', labelKey: 'legal.navigation.about' },
  { path: '/contact', labelKey: 'legal.navigation.contact' },
  { path: '/services', labelKey: 'legal.navigation.services' },
  { path: '/pricing', labelKey: 'legal.navigation.pricing' },
  { path: '/terms', labelKey: 'legal.navigation.terms' },
  { path: '/privacy', labelKey: 'legal.navigation.privacy' },
  { path: '/refund-policy', labelKey: 'legal.navigation.refundPolicy' },
];

// Content configuration for each page (using translation keys)
const pageContentConfig: Record<string, { paragraphs: string[]; strongParagraphs?: string[] }> = {
  about: { paragraphs: ['p1', 'p2', 'p3', 'p4'], strongParagraphs: ['p3'] },
  contact: { paragraphs: [], strongParagraphs: [] }, // Special rendering
  services: { paragraphs: ['p1', 'p2', 'p3'], strongParagraphs: ['p3'] },
  pricing: { paragraphs: ['p1', 'p2', 'p3', 'p4'], strongParagraphs: ['p3'] },
  refundPolicy: { paragraphs: ['p1', 'p2', 'p3'], strongParagraphs: ['p3'] },
  privacy: { paragraphs: ['p1', 'p2', 'p3', 'p4'], strongParagraphs: ['p4'] },
  terms: { paragraphs: ['p1', 'p2', 'p3'], strongParagraphs: ['p3'] },
};

// Helper component to render legal content
const LegalContent: React.FC<{ translationKey: string }> = ({ translationKey }) => {
  // Special handling for contact page with structured data
  if (translationKey === 'contact') {
    return (
      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-light text-neutral-900 mb-4 tracking-tight">
            <T tKey="legal.pages.contact.platform.title" />
          </h2>
          <ul className="space-y-3 text-base text-neutral-600 leading-relaxed">
            <li>
              <span className="font-medium text-neutral-900"><T tKey="legal.pages.contact.platform.companyName" />:</span>{' '}
              <T tKey="legal.pages.contact.platform.companyNameValue" />
            </li>
            <li>
              <span className="font-medium text-neutral-900"><T tKey="legal.pages.contact.platform.email" />:</span>{' '}
              <T tKey="legal.pages.contact.platform.emailValue" />
            </li>
            <li>
              <span className="font-medium text-neutral-900"><T tKey="legal.pages.contact.platform.phone" />:</span>{' '}
              <T tKey="legal.pages.contact.platform.phoneValue" />
            </li>
            <li>
              <span className="font-medium text-neutral-900"><T tKey="legal.pages.contact.platform.address" />:</span>{' '}
              <T tKey="legal.pages.contact.platform.addressValue" />
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-light text-neutral-900 mb-4 tracking-tight">
            <T tKey="legal.pages.contact.merchants.title" />
          </h2>
          <div className="space-y-4 text-base text-neutral-600 leading-relaxed">
            <p><T tKey="legal.pages.contact.merchants.p1" /></p>
            <p className="font-medium text-neutral-900">
              <T tKey="legal.pages.contact.merchants.p2" />
            </p>
          </div>
        </section>
      </div>
    );
  }

  // Get the content configuration for this page
  const config = pageContentConfig[translationKey];
  if (!config) return null;

  const { paragraphs, strongParagraphs = [] } = config;
  
  // Special handling for services page with subtitle
  if (translationKey === 'services') {
    return (
      <div className="space-y-6">
        <p className="text-sm text-neutral-500 uppercase tracking-wide mb-6">
          <T tKey="legal.pages.services.subtitle" />
        </p>
        <div className="space-y-4 text-base text-neutral-600 leading-relaxed">
          {paragraphs.map((key) => {
            const isStrong = strongParagraphs.includes(key);
            return (
              <p key={key} className={isStrong ? 'font-medium text-neutral-900' : ''}>
                <T tKey={`legal.pages.${translationKey}.content.${key}`} />
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  // Default rendering for other pages
  return (
    <div className="space-y-4 text-base text-neutral-500 leading-relaxed font-light">
      {paragraphs.map((key) => {
        const isStrong = strongParagraphs.includes(key);
        return (
          <p key={key} className={isStrong ? 'text-neutral-900' : ''}>
            <T tKey={`legal.pages.${translationKey}.content.${key}`} />
          </p>
        );
      })}
    </div>
  );
};

const LegalPage: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const pageKey = location.pathname.replace('/', '') || 'about';
  
  // Map URL path to translation key
  const translationKey = pathToTranslationKey[pageKey];
  
  // Check if the page exists in translations
  const pageExists = translationKey && t(`legal.pages.${translationKey}.title`) !== `legal.pages.${translationKey}.title`;

  if (!pageExists) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-light text-neutral-900 mb-6 tracking-tight">
            <T tKey="legal.notFound.title" />
          </h1>
          <Link to="/" className="text-lg text-neutral-500 hover:text-neutral-900 transition-colors">
            <T tKey="legal.notFound.backToHome" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Same as Landing Page */}
      <LandingHeader />

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <nav className="sticky top-24">
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
                        <T tKey={link.labelKey} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Content */}
            <main className="lg:col-span-3">
              <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-8 tracking-tight leading-[1.1]">
                <T tKey={`legal.pages.${translationKey}.title`} />
              </h1>
              <LegalContent translationKey={translationKey} />
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            <T tKey="legal.footer.copyright" />
          </p>
          <Link to="/" className="text-neutral-500 hover:text-neutral-900 text-sm transition-colors">
            <T tKey="legal.footer.backToHome" />
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LegalPage;
