import React from 'react';
import { Link } from 'react-router-dom';
import { StoreSettings } from '../types';

interface StorefrontFooterProps {
  settings?: StoreSettings | null;
  footerBackgroundColor?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerLinkColor?: string;
}

const StorefrontFooter: React.FC<StorefrontFooterProps> = ({ 
  settings,
  footerBackgroundColor,
  footerTextColor,
  footerHeadingColor,
  footerLinkColor,
}) => {
  const bgColor = footerBackgroundColor || settings?.footerBackgroundColor || '#ffffff';
  const textColor = footerTextColor || settings?.footerTextColor || '#171717';
  const headingColor = footerHeadingColor || settings?.footerHeadingColor || '#171717';
  const linkColor = footerLinkColor || settings?.footerLinkColor || '#525252';

  return (
    <footer className="border-t mt-auto" style={{ backgroundColor: bgColor, borderColor: '#e5e5e5' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Links and Social Media Section */}
        <div className="flex flex-col items-center">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Quick Links */}
            {(settings?.aboutUs?.content || settings?.privacyPolicy?.content || settings?.termsOfService?.content) && (
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-medium mb-3 tracking-wide uppercase" style={{ color: headingColor }}>Quick Links</h3>
                <ul className="space-y-2">
                  {settings?.aboutUs?.content && (
                    <li>
                      <Link
                        to="/about"
                        className="text-xs transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => e.currentTarget.style.color = textColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = linkColor}
                      >
                        About Us
                      </Link>
                    </li>
                  )}
                  {settings?.privacyPolicy?.content && (
                    <li>
                      <Link
                        to="/privacy"
                        className="text-xs transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => e.currentTarget.style.color = textColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = linkColor}
                      >
                        Privacy Policy
                      </Link>
                    </li>
                  )}
                  {settings?.termsOfService?.content && (
                    <li>
                      <Link
                        to="/terms"
                        className="text-xs transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => e.currentTarget.style.color = textColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = linkColor}
                      >
                        Terms of Service
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Customer Service */}
            {(settings?.shippingInfo?.content || settings?.returns?.content || settings?.faq?.content || settings?.trackOrderUrl) && (
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-medium mb-3 tracking-wide uppercase" style={{ color: headingColor }}>Customer Service</h3>
                <ul className="space-y-2">
                  {settings?.shippingInfo?.content && (
                    <li>
                      <Link
                        to="/shipping"
                        className="text-xs transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => e.currentTarget.style.color = textColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = linkColor}
                      >
                        Shipping Info
                      </Link>
                    </li>
                  )}
                  {settings?.returns?.content && (
                    <li>
                      <Link
                        to="/returns"
                        className="text-xs transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => e.currentTarget.style.color = textColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = linkColor}
                      >
                        Returns
                      </Link>
                    </li>
                  )}
                  {settings?.faq?.content && (
                    <li>
                      <Link
                        to="/faq"
                        className="text-xs transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => e.currentTarget.style.color = textColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = linkColor}
                      >
                        FAQ
                      </Link>
                    </li>
                  )}
                  {settings?.trackOrderUrl && (
                    <li>
                      <a
                        href={settings.trackOrderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => e.currentTarget.style.color = textColor}
                        onMouseLeave={(e) => e.currentTarget.style.color = linkColor}
                      >
                        Track Order
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Contact (with social icons below) */}
            {(settings?.contact?.content || settings?.facebookUrl || settings?.twitterUrl || settings?.instagramUrl || settings?.linkedinUrl || settings?.youtubeUrl) && (
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-medium mb-3 tracking-wide uppercase" style={{ color: headingColor }}>Contact</h3>
                {settings?.contact?.content && (
                  <div className="text-xs whitespace-pre-wrap leading-relaxed mb-4" style={{ color: textColor }}>
                    {settings.contact.content}
                  </div>
                )}
                {(settings?.facebookUrl || settings?.twitterUrl || settings?.instagramUrl || settings?.linkedinUrl || settings?.youtubeUrl) && (
                  <div className="flex items-center justify-center sm:justify-start space-x-3">
                    {settings?.facebookUrl && (
                      <a
                        href={settings.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-800 hover:text-white transition-all"
                        aria-label="Facebook"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                    )}
                    {settings?.twitterUrl && (
                      <a
                        href={settings.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-800 hover:text-white transition-all"
                        aria-label="Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </a>
                    )}
                    {settings?.instagramUrl && (
                      <a
                        href={settings.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-800 hover:text-white transition-all"
                        aria-label="Instagram"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                    {settings?.linkedinUrl && (
                      <a
                        href={settings.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-800 hover:text-white transition-all"
                        aria-label="LinkedIn"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    {settings?.youtubeUrl && (
                      <a
                        href={settings.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-800 hover:border-neutral-800 hover:text-white transition-all"
                        aria-label="YouTube"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t w-full" style={{ borderColor: '#e5e5e5' }}>
            <p className="text-xs text-center" style={{ color: textColor, opacity: 0.7 }}>
              © {new Date().getFullYear()} Powered by Shopu.ge. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StorefrontFooter;