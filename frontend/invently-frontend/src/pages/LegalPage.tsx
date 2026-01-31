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
  pricing: { paragraphs: ['p1', 'p2', 'p3'], strongParagraphs: ['p3'] },
  refundPolicy: { paragraphs: ['p1', 'p2', 'p3'], strongParagraphs: ['p3'] },
  privacy: { paragraphs: ['p1', 'p2', 'p3', 'p4'], strongParagraphs: ['p4'] },
  terms: { paragraphs: ['p1', 'p2', 'p3'], strongParagraphs: ['p3'] },
};

// Helper component to render legal content
const LegalContent: React.FC<{ translationKey: string }> = ({ translationKey }) => {
  // Special handling for contact page with structured data
  if (translationKey === 'contact') {
    return (
      <div className="space-y-8 text-neutral-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-medium text-neutral-900 mb-4">
            <T tKey="legal.pages.contact.platform.title" />
          </h2>
          <ul className="space-y-2">
            <li>
              <strong><T tKey="legal.pages.contact.platform.companyName" />:</strong>{' '}
              <T tKey="legal.pages.contact.platform.companyNameValue" />
            </li>
            <li>
              <strong><T tKey="legal.pages.contact.platform.email" />:</strong>{' '}
              <T tKey="legal.pages.contact.platform.emailValue" />
            </li>
            <li>
              <strong><T tKey="legal.pages.contact.platform.phone" />:</strong>{' '}
              <T tKey="legal.pages.contact.platform.phoneValue" />
            </li>
            <li>
              <strong><T tKey="legal.pages.contact.platform.address" />:</strong>{' '}
              <T tKey="legal.pages.contact.platform.addressValue" />
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-neutral-900 mb-4">
            <T tKey="legal.pages.contact.merchants.title" />
          </h2>
          <p><T tKey="legal.pages.contact.merchants.p1" /></p>
          <p className="mt-4">
            <strong><T tKey="legal.pages.contact.merchants.p2" /></strong>
          </p>
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
      <div className="space-y-6 text-neutral-600 leading-relaxed">
        <p className="text-sm text-neutral-500 uppercase tracking-wide">
          <T tKey="legal.pages.services.subtitle" />
        </p>
        {paragraphs.map((key) => {
          const isStrong = strongParagraphs.includes(key);
          return (
            <p key={key}>
              {isStrong ? (
                <strong><T tKey={`legal.pages.${translationKey}.content.${key}`} /></strong>
              ) : (
                <T tKey={`legal.pages.${translationKey}.content.${key}`} />
              )}
            </p>
          );
        })}
      </div>
    );
  }

  // Default rendering for other pages
  return (
    <div className="space-y-6 text-neutral-600 leading-relaxed">
      {paragraphs.map((key) => {
        const isStrong = strongParagraphs.includes(key);
        return (
          <p key={key}>
            {isStrong ? (
              <strong><T tKey={`legal.pages.${translationKey}.content.${key}`} /></strong>
            ) : (
              <T tKey={`legal.pages.${translationKey}.content.${key}`} />
            )}
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
          <h1 className="text-2xl font-light text-neutral-900 mb-4">
            <T tKey="legal.notFound.title" />
          </h1>
          <Link to="/" className="text-neutral-900 hover:text-neutral-700">
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
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid lg:grid-cols-4 gap-10">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <nav className="sticky top-24">
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">
                  <T tKey="legal.nav.title" />
                </h3>
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          location.pathname === link.path
                            ? 'bg-neutral-100 text-neutral-900 font-medium'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
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
              <h1 className="text-3xl font-light text-neutral-900 mb-8 tracking-tight">
                <T tKey={`legal.pages.${translationKey}.title`} />
              </h1>
              <LegalContent translationKey={translationKey} />
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-neutral-400 text-sm">
            <T tKey="legal.footer.copyright" />
          </p>
          <Link to="/" className="text-neutral-500 hover:text-neutral-900 text-sm">
            <T tKey="legal.footer.backToHome" />
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LegalPage;
