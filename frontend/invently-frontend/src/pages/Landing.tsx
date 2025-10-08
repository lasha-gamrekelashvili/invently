import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ShoppingBagIcon,
  ChartBarIcon,
  CubeIcon,
  BoltIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import { T } from '../components/Translation';
import LanguageSelector from '../components/LanguageSelector';

const Landing = () => {
  const { t } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    { src: '/assets/dashboard-image.png', alt: 'Dashboard Preview' },
    { src: '/assets/category-image.png', alt: 'Category Management Preview' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: ShoppingBagIcon,
      titleKey: 'landing.features.items.storefronts.title',
      descriptionKey: 'landing.features.items.storefronts.description'
    },
    {
      icon: CubeIcon,
      titleKey: 'landing.features.items.inventory.title',
      descriptionKey: 'landing.features.items.inventory.description'
    },
    {
      icon: ChartBarIcon,
      titleKey: 'landing.features.items.analytics.title',
      descriptionKey: 'landing.features.items.analytics.description'
    },
    {
      icon: GlobeAltIcon,
      titleKey: 'landing.features.items.multilanguage.title',
      descriptionKey: 'landing.features.items.multilanguage.description'
    },
    {
      icon: BoltIcon,
      titleKey: 'landing.features.items.fast.title',
      descriptionKey: 'landing.features.items.fast.description'
    },
    {
      icon: ShieldCheckIcon,
      titleKey: 'landing.features.items.secure.title',
      descriptionKey: 'landing.features.items.secure.description'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <CubeIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                <T tKey="landing.nav.brand" />
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSelector variant="micro" showLabel={false} />
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <T tKey="landing.nav.login" />
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <T tKey="landing.nav.getStarted" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
            <BoltIcon className="w-4 h-4" />
            <span><T tKey="landing.hero.badge" /></span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 animate-slide-up">
            <T tKey="landing.hero.title" />
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <T tKey="landing.hero.titleGradient" />
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto animate-fade-in">
            <T tKey="landing.hero.subtitle" />
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <T tKey="landing.hero.startFreeTrial" />
            </Link>
            <button
              className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
            >
              <T tKey="landing.hero.watchDemo" />
            </button>
          </div>
        </div>

        {/* Hero Image/Mockup - Animated Slider */}
        <div className="mt-20 animate-slide-up">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-8 overflow-hidden">
              <div className="relative aspect-video">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image.src}
                    alt={image.alt}
                    className={`absolute inset-0 w-full h-full object-cover rounded-lg shadow-lg transition-all duration-1000 ease-in-out ${
                      index === currentImage
                        ? 'opacity-100 translate-x-0'
                        : index < currentImage
                        ? 'opacity-0 -translate-x-full'
                        : 'opacity-0 translate-x-full'
                    }`}
                  />
                ))}
              </div>

              {/* Slider Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentImage
                        ? 'w-8 bg-blue-600'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              <T tKey="landing.features.title" />
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              <T tKey="landing.features.subtitle" />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  <T tKey={feature.titleKey} />
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  <T tKey={feature.descriptionKey} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              <T tKey="landing.cta.title" />
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              <T tKey="landing.cta.subtitle" />
            </p>
            <Link
              to="/register"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <T tKey="landing.cta.button" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <CubeIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900"><T tKey="landing.nav.brand" /></span>
            </div>
            <p className="text-gray-600">
              <T tKey="landing.footer.copyright" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
