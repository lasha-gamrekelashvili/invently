import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ShoppingBagIcon,
  ChartBarIcon,
  CubeIcon,
  BoltIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  XMarkIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline';
import { T } from '../components/Translation';
import LandingHeader from '../components/LandingHeader';
import ShopsCarousel from '../components/ShopsCarousel';
import dashboardImage from '../../assets/dashboard-image.png';
import categoryImage from '../../assets/category-image.png';

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = [
    { src: dashboardImage, alt: 'Dashboard Preview' },
    { src: categoryImage, alt: 'Category Management Preview' }
  ];


  const features = [
    {
      icon: ShoppingBagIcon,
      titleKey: 'landing.features.items.storefronts.title',
      descriptionKey: 'landing.features.items.storefronts.description',
      iconColor: 'text-blue-400'
    },
    {
      icon: CubeIcon,
      titleKey: 'landing.features.items.inventory.title',
      descriptionKey: 'landing.features.items.inventory.description',
      iconColor: 'text-purple-400'
    },
    {
      icon: ChartBarIcon,
      titleKey: 'landing.features.items.analytics.title',
      descriptionKey: 'landing.features.items.analytics.description',
      iconColor: 'text-indigo-400'
    },
    {
      icon: GlobeAltIcon,
      titleKey: 'landing.features.items.multilanguage.title',
      descriptionKey: 'landing.features.items.multilanguage.description',
      iconColor: 'text-green-400'
    },
    {
      icon: BoltIcon,
      titleKey: 'landing.features.items.fast.title',
      descriptionKey: 'landing.features.items.fast.description',
      iconColor: 'text-orange-400'
    },
    {
      icon: ShieldCheckIcon,
      titleKey: 'landing.features.items.secure.title',
      descriptionKey: 'landing.features.items.secure.description',
      iconColor: 'text-emerald-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <LandingHeader showAuthButtons={true} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left - Text Content */}
            <div className="fade-in">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-normal pb-1">
                <T tKey="landing.hero.title" />
                {' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent pb-2 inline-block">
                  <T tKey="landing.hero.titleGradient" />
                </span>
              </h1>

              <p className="fade-in fade-in-delay-1 text-base lg:text-lg text-gray-300 mt-6 mb-8 leading-relaxed">
                <T tKey="landing.hero.subtitle" />
              </p>

              <div className="fade-in fade-in-delay-2 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-7 py-3.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  <T tKey="landing.hero.startFreeTrial" />
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-7 py-3.5 rounded-xl font-semibold transition-all"
                >
                  <T tKey="landing.hero.watchDemo" />
                </Link>
              </div>
            </div>

            {/* Right - Product Preview */}
            <div className="fade-in fade-in-delay-3">
              <div className="bg-white/5 rounded-2xl p-2 border border-white/10 shadow-2xl">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-white/10 text-xs text-gray-400">
                      shopu.ge/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Image - Click to zoom */}
                <div 
                  className="relative overflow-hidden rounded-b-xl bg-gray-800 cursor-zoom-in group"
                  onClick={() => setLightboxOpen(true)}
                >
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image.src}
                      alt={image.alt}
                      className={`w-full h-auto transition-all duration-500 group-hover:scale-105 ${
                        index === currentImage ? 'opacity-100' : 'opacity-0 absolute inset-0'
                      }`}
                    />
                  ))}
                  {/* Zoom hint overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <MagnifyingGlassPlusIcon className="w-10 h-10 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                  </div>
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-2 py-4">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentImage
                          ? 'w-8 bg-blue-500'
                          : 'w-1.5 bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shops Carousel */}
      <ShopsCarousel />

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              <T tKey="landing.features.title" />
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              <T tKey="landing.features.subtitle" />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card bg-gray-900 rounded-2xl p-8 hover:bg-gray-800 transition-colors"
              >
                <div className={`w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  <T tKey={feature.titleKey} />
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  <T tKey={feature.descriptionKey} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            <T tKey="landing.cta.title" />
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
            <T tKey="landing.cta.subtitle" />
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
          >
            <T tKey="landing.cta.button" />
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer with Legal Info */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 lg:gap-24 text-center md:text-left">
              {/* Company Info */}
              <div>
                <h4 className="text-gray-900 font-semibold mb-4">
                  <T tKey="landing.footer.company.title" />
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/about" className="text-gray-500 hover:text-gray-900 transition-colors">
                      <T tKey="landing.footer.company.aboutUs" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-500 hover:text-gray-900 transition-colors">
                      <T tKey="landing.footer.company.contact" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/services" className="text-gray-500 hover:text-gray-900 transition-colors">
                      <T tKey="landing.footer.company.services" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="text-gray-500 hover:text-gray-900 transition-colors">
                      <T tKey="landing.footer.company.pricing" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-gray-900 font-semibold mb-4">
                  <T tKey="landing.footer.legal.title" />
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/terms" className="text-gray-500 hover:text-gray-900 transition-colors">
                      <T tKey="landing.footer.legal.terms" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">
                      <T tKey="landing.footer.legal.privacy" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/refund-policy" className="text-gray-500 hover:text-gray-900 transition-colors">
                      <T tKey="landing.footer.legal.refundPolicy" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-gray-900 font-semibold mb-4">
                  <T tKey="landing.footer.contactInfo.title" />
                </h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><T tKey="landing.footer.contactInfo.email" /></li>
                  <li><T tKey="landing.footer.contactInfo.phone" /></li>
                  <li><T tKey="landing.footer.contactInfo.address" /></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxOpen(false)}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          {/* Navigation arrows */}
          <button
            className="absolute left-4 text-white/80 hover:text-white p-2"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
            }}
          >
            <ArrowRightIcon className="w-8 h-8 rotate-180" />
          </button>
          <button
            className="absolute right-4 text-white/80 hover:text-white p-2"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImage((prev) => (prev + 1) % images.length);
            }}
          >
            <ArrowRightIcon className="w-8 h-8" />
          </button>

          {/* Image */}
          <img
            src={images[currentImage].src}
            alt={images[currentImage].alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Indicators */}
          <div className="absolute bottom-6 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImage(index);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentImage
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Landing;
