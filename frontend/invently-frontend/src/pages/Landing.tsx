import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowRightIcon,
  ArrowDownIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { T } from '../components/Translation';
import LandingHeader from '../components/LandingHeader';
import dashboardImage from '../../assets/dashboard.png';
import categoryImage from '../../assets/Categories.png';
import productsImage from '../../assets/Products.png';

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = [
    { src: dashboardImage, alt: 'Dashboard Preview' },
    { src: categoryImage, alt: 'Category Management Preview' },
    { src: productsImage, alt: 'Products Management Preview' }
  ];

  // Why Shopu comparison points - simplified
  const whyShopuPoints = [
    {
      titleKey: 'landing.whyShopu.points.local.title',
      descriptionKey: 'landing.whyShopu.points.local.description'
    },
    {
      titleKey: 'landing.whyShopu.points.language.title',
      descriptionKey: 'landing.whyShopu.points.language.description'
    },
    {
      titleKey: 'landing.whyShopu.points.support.title',
      descriptionKey: 'landing.whyShopu.points.support.description'
    },
    {
      titleKey: 'landing.whyShopu.points.simple.title',
      descriptionKey: 'landing.whyShopu.points.simple.description'
    }
  ];

  // How it works steps - simplified
  const howItWorksSteps = [
    {
      number: '01',
      titleKey: 'landing.howItWorks.steps.create.title',
      descriptionKey: 'landing.howItWorks.steps.create.description'
    },
    {
      number: '02',
      titleKey: 'landing.howItWorks.steps.add.title',
      descriptionKey: 'landing.howItWorks.steps.add.description'
    },
    {
      number: '03',
      titleKey: 'landing.howItWorks.steps.sell.title',
      descriptionKey: 'landing.howItWorks.steps.sell.description'
    }
  ];

  // Features - simplified
  const features = [
    {
      titleKey: 'landing.features.items.storefronts.title',
      descriptionKey: 'landing.features.items.storefronts.description'
    },
    {
      titleKey: 'landing.features.items.inventory.title',
      descriptionKey: 'landing.features.items.inventory.description'
    },
    {
      titleKey: 'landing.features.items.analytics.title',
      descriptionKey: 'landing.features.items.analytics.description'
    },
    {
      titleKey: 'landing.features.items.multilanguage.title',
      descriptionKey: 'landing.features.items.multilanguage.description'
    },
    {
      titleKey: 'landing.features.items.fast.title',
      descriptionKey: 'landing.features.items.fast.description'
    },
    {
      titleKey: 'landing.features.items.secure.title',
      descriptionKey: 'landing.features.items.secure.description'
    }
  ];

  // Monthly plan
  const monthlyPlan = {
    price: '49',
    period: 'landing.pricing.period'
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <LandingHeader showAuthButtons={true} />

      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-neutral-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left - Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] mb-6">
                <T tKey="landing.hero.title" />
                <span className="block mt-3 font-medium text-neutral-300">
                  <T tKey="landing.hero.titleHighlight" />
                </span>
              </h1>
              
              <p className="text-lg text-neutral-400 mb-4 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                <T tKey="landing.hero.subtitle" />
              </p>
              
              <p className="text-sm text-neutral-500 mb-8 max-w-md mx-auto lg:mx-0">
                <T tKey="landing.hero.reassurance" />
              </p>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-3 bg-white text-neutral-900 hover:bg-neutral-100 px-8 py-4 rounded-full font-medium transition-all"
                >
                  <T tKey="landing.hero.primaryCta" />
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#how-it-works"
                  className="group inline-flex items-center justify-center gap-2 text-neutral-100 bg-neutral-800 hover:bg-neutral-800/90 px-8 py-4 rounded-full font-medium transition-colors border border-neutral-700 hover:border-neutral-600"
                >
                  <T tKey="landing.hero.secondaryCta" />
                  <ArrowDownIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right - Product Preview */}
            <div>
              <div className="bg-neutral-800 rounded-2xl p-1.5 border border-neutral-600">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-neutral-200 text-xs text-neutral-700">
                      shopu.ge/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Image */}
                <div 
                  className="relative overflow-hidden rounded-b-xl bg-neutral-900 cursor-pointer group"
                  onClick={() => setLightboxOpen(true)}
                >
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image.src}
                      alt={image.alt}
                      className={`w-full h-auto transition-opacity duration-500 ${
                        index === currentImage ? 'opacity-100' : 'opacity-0 absolute inset-0'
                      }`}
                    />
                  ))}
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-2 py-4">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        index === currentImage
                          ? 'w-6 bg-white'
                          : 'w-1 bg-neutral-600 hover:bg-neutral-500'
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

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
              <T tKey="landing.howItWorks.title" />
            </h2>
            <p className="text-lg text-neutral-500 max-w-xl mx-auto">
              <T tKey="landing.howItWorks.subtitle" />
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-extralight text-neutral-300 mb-6">
                  {step.number}
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-3">
                  <T tKey={step.titleKey} />
                </h3>
                <p className="text-neutral-500 leading-relaxed">
                  <T tKey={step.descriptionKey} />
                </p>
              </div>
            ))}
          </div>

          {/* Time estimate */}
          <div className="text-center mt-8">
            <span className="inline-flex items-center gap-2 text-neutral-500 text-sm font-medium tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
              <T tKey="landing.howItWorks.timeEstimate" />
            </span>
          </div>
        </div>
      </section>

      {/* ===== WHY SHOPU SECTION ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
              <T tKey="landing.whyShopu.title" />
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              <T tKey="landing.whyShopu.subtitle" />
            </p>
          </div>

          {/* Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {whyShopuPoints.map((point, index) => (
              <div key={index} className="flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 font-light text-sm">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    <T tKey={point.titleKey} />
                  </h3>
                  <p className="text-neutral-500 leading-relaxed">
                    <T tKey={point.descriptionKey} />
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison callout */}
          <div className="mt-10 p-8 sm:p-10 rounded-2xl bg-neutral-50 border border-neutral-100">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="flex-1">
                <h3 className="text-xl font-medium text-neutral-900 mb-2">
                  <T tKey="landing.whyShopu.comparison.title" />
                </h3>
                <p className="text-neutral-500">
                  <T tKey="landing.whyShopu.comparison.description" />
                </p>
              </div>
              <Link
                to="/register"
                className="group flex-shrink-0 inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                <T tKey="landing.whyShopu.comparison.cta" />
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="py-16 sm:py-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
              <T tKey="landing.pricing.title" />
            </h2>
            <p className="text-lg text-neutral-500 max-w-xl mx-auto">
              <T tKey="landing.pricing.subtitle" />
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-2xl mx-auto">
            <div className="p-10 sm:p-12 rounded-2xl bg-neutral-900 text-white">
              {/* Pricing Flow */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mb-6">
                {/* 1 GEL */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-6xl sm:text-7xl font-light">1</span>
                    <span className="text-2xl sm:text-3xl font-light text-neutral-400">
                      <T tKey="landing.pricing.currency" />
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:block text-neutral-600">
                  <ArrowRightIcon className="w-8 h-8" />
                </div>
                <div className="md:hidden text-neutral-600 rotate-90">
                  <ArrowRightIcon className="w-8 h-8" />
                </div>

                {/* 49 GEL/month */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-6xl sm:text-7xl font-light">
                      {monthlyPlan.price}
                    </span>
                    <span className="text-2xl sm:text-3xl font-light text-neutral-400">
                      <T tKey={monthlyPlan.period} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-center text-neutral-300 mb-6 max-w-lg mx-auto">
                <T tKey="landing.pricing.flowDescription" />
              </p>

              {/* CTA Button */}
              <div className="text-center">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 bg-white text-neutral-900 hover:bg-neutral-100 px-8 py-4 rounded-full font-medium transition-colors text-lg"
                >
                  <T tKey="landing.pricing.entryPoint.cta" />
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
              <T tKey="landing.features.title" />
            </h2>
            <p className="text-lg text-neutral-500 max-w-xl mx-auto">
              <T tKey="landing.features.subtitle" />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400 font-light text-sm">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  <T tKey={feature.titleKey} />
                </h3>
                <p className="text-neutral-500 leading-relaxed">
                  <T tKey={feature.descriptionKey} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-16 sm:py-20 bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-light text-white mb-4 tracking-tight">
            <T tKey="landing.cta.title" />
          </h2>
          <p className="text-lg text-neutral-400 mb-8 max-w-xl mx-auto">
            <T tKey="landing.cta.subtitle" />
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-3 bg-white text-neutral-900 hover:bg-neutral-100 px-8 py-4 rounded-full font-medium transition-colors"
          >
            <T tKey="landing.cta.button" />
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-neutral-50 border-t border-neutral-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 text-center md:text-left">
            {/* Company Info */}
            <div>
              <h4 className="text-neutral-900 font-medium mb-3 text-sm uppercase tracking-wide">
                <T tKey="landing.footer.company.title" />
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/about" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <T tKey="landing.footer.company.aboutUs" />
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <T tKey="landing.footer.company.contact" />
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <T tKey="landing.footer.company.services" />
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <T tKey="landing.footer.company.pricing" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-neutral-900 font-medium mb-3 text-sm uppercase tracking-wide">
                <T tKey="landing.footer.legal.title" />
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/terms" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <T tKey="landing.footer.legal.terms" />
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <T tKey="landing.footer.legal.privacy" />
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="text-neutral-500 hover:text-neutral-900 transition-colors">
                    <T tKey="landing.footer.legal.refundPolicy" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact (with social icons below) */}
            <div>
              <h4 className="text-neutral-900 font-medium mb-3 text-sm uppercase tracking-wide">
                <T tKey="landing.footer.contactInfo.title" />
              </h4>
              <ul className="space-y-2 text-xs text-neutral-500 mb-4">
                <li><T tKey="landing.footer.contactInfo.email" /></li>
                <li><T tKey="landing.footer.contactInfo.phone" /></li>
                <li><T tKey="landing.footer.contactInfo.address" /></li>
              </ul>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <a href="https://www.facebook.com/shopu.ge" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-800 hover:text-white transition-all" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://www.instagram.com/shopu.ge" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-800 hover:text-white transition-all" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                <a href="https://www.linkedin.com/company/shopu-ge" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-800 hover:text-white transition-all" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-10 pt-6 border-t border-neutral-200 text-center">
            <p className="text-neutral-400 text-xs">
              <T tKey="landing.footer.copyright" />
            </p>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-neutral-900/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button 
            className="absolute top-6 right-6 text-neutral-400 hover:text-white p-2 z-10 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          <button
            className="absolute left-6 text-neutral-400 hover:text-white p-2 z-10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
            }}
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            className="absolute right-6 text-neutral-400 hover:text-white p-2 z-10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImage((prev) => (prev + 1) % images.length);
            }}
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>

          <img
            src={images[currentImage].src}
            alt={images[currentImage].alt}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-8 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImage(index);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentImage
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-neutral-600 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }

        .animate-scroll {
          animation: scroll linear infinite;
          width: max-content;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Landing;
