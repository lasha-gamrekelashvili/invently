import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StoreSettings } from '../types';

interface StorefrontFooterProps {
  settings?: StoreSettings | null;
}

const StorefrontFooter: React.FC<StorefrontFooterProps> = ({ settings }) => {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const handlePopupOpen = (popupType: string) => {
    setActivePopup(popupType);
  };

  const handlePopupClose = () => {
    setActivePopup(null);
  };

  // Popup component
  const ContentPopup = ({ title, content, onClose }: { title: string; content: string; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{content}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Links and Social Media Section */}
        <div>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            {/* Quick Links and Customer Service */}
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 w-full lg:w-auto">
              {/* Quick Links */}
              <div className="flex-1 sm:flex-none">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
                <ul className="space-y-2">
                  {settings?.aboutUs?.content && (
                    <li>
                      <button 
                        onClick={() => handlePopupOpen('aboutUs')}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors block"
                      >
                        About Us
                      </button>
                    </li>
                  )}
                  {settings?.privacyPolicy?.content && (
                    <li>
                      <button 
                        onClick={() => handlePopupOpen('privacyPolicy')}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors block"
                      >
                        Privacy Policy
                      </button>
                    </li>
                  )}
                  {settings?.termsOfService?.content && (
                    <li>
                      <button 
                        onClick={() => handlePopupOpen('termsOfService')}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors block"
                      >
                        Terms of Service
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              {/* Customer Service */}
              <div className="flex-1 sm:flex-none">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Service</h3>
                <ul className="space-y-2">
                  {settings?.shippingInfo?.content && (
                    <li>
                      <button 
                        onClick={() => handlePopupOpen('shippingInfo')}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors block"
                      >
                        Shipping Info
                      </button>
                    </li>
                  )}
                  {settings?.returns?.content && (
                    <li>
                      <button 
                        onClick={() => handlePopupOpen('returns')}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors block"
                      >
                        Returns
                      </button>
                    </li>
                  )}
                  {settings?.faq?.content && (
                    <li>
                      <button 
                        onClick={() => handlePopupOpen('faq')}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors block"
                      >
                        FAQ
                      </button>
                    </li>
                  )}
                  {settings?.trackOrderUrl && (
                    <li>
                      <a 
                        href={settings.trackOrderUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors block"
                      >
                        Track Order
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Social Media and Contact */}
            <div className="flex flex-col items-start lg:items-end space-y-4 w-full lg:w-auto">
              {/* Social Media */}
              {(settings?.facebookUrl || settings?.twitterUrl || settings?.instagramUrl || settings?.linkedinUrl || settings?.youtubeUrl) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <span className="text-xs text-gray-500 font-medium">Follow us:</span>
                  <div className="flex items-center space-x-3">
                  {/* Facebook */}
                  {settings?.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                      aria-label="Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {/* Twitter */}
                  {settings?.twitterUrl && (
                    <a
                      href={settings.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all"
                      aria-label="Twitter"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </a>
                  )}
                  {/* Instagram */}
                  {settings?.instagramUrl && (
                    <a
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all"
                      aria-label="Instagram"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                  )}
                  {/* LinkedIn */}
                  {settings?.linkedinUrl && (
                    <a
                      href={settings.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-700 hover:text-white transition-all"
                      aria-label="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  {/* YouTube */}
                  {settings?.youtubeUrl && (
                    <a
                      href={settings.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                      aria-label="YouTube"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

              {/* Contact Information */}
              {settings?.contact?.content && (
                <div className="text-left lg:text-right">
                  <div className="text-xs text-gray-500 font-medium mb-2"></div>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap max-w-xs">
                    {settings.contact.content}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Powered by Invently. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Popups */}
      {activePopup === 'aboutUs' && settings?.aboutUs?.content && (
        <ContentPopup
          title="About Us"
          content={settings.aboutUs.content}
          onClose={handlePopupClose}
        />
      )}
      {activePopup === 'privacyPolicy' && settings?.privacyPolicy?.content && (
        <ContentPopup
          title="Privacy Policy"
          content={settings.privacyPolicy.content}
          onClose={handlePopupClose}
        />
      )}
      {activePopup === 'termsOfService' && settings?.termsOfService?.content && (
        <ContentPopup
          title="Terms of Service"
          content={settings.termsOfService.content}
          onClose={handlePopupClose}
        />
      )}
      {activePopup === 'shippingInfo' && settings?.shippingInfo?.content && (
        <ContentPopup
          title="Shipping Info"
          content={settings.shippingInfo.content}
          onClose={handlePopupClose}
        />
      )}
      {activePopup === 'returns' && settings?.returns?.content && (
        <ContentPopup
          title="Returns"
          content={settings.returns.content}
          onClose={handlePopupClose}
        />
      )}
      {activePopup === 'faq' && settings?.faq?.content && (
        <ContentPopup
          title="FAQ"
          content={settings.faq.content}
          onClose={handlePopupClose}
        />
      )}
    </footer>
  );
};

export default StorefrontFooter;