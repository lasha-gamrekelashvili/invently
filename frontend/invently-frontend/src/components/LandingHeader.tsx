import React from 'react';
import { Link } from 'react-router-dom';
import { T } from './Translation';
import LanguageSelector from './LanguageSelector';
import Logo from './Logo';

interface LandingHeaderProps {
  showAuthButtons?: boolean;
  mobileMenuButton?: React.ReactNode;
  shopName?: string;
  centerContent?: React.ReactNode;
  rightActions?: React.ReactNode;
  showLanguageSelector?: boolean;
  mobileSearchExpanded?: boolean;
  mobileSearchContent?: React.ReactNode;
  mobileSearchButton?: React.ReactNode;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({
  showAuthButtons = false,
  mobileMenuButton,
  shopName,
  centerContent,
  rightActions,
  showLanguageSelector = true,
  mobileSearchExpanded = false,
  mobileSearchContent,
  mobileSearchButton,
}) => {
  return (
    <nav className="bg-gray-100 border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-3 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20 gap-2 sm:gap-4">
          {/* Mobile Search Expanded View */}
          {mobileSearchExpanded && mobileSearchContent ? (
            <div className="flex-1 md:hidden">
              {mobileSearchContent}
            </div>
          ) : (
            <>
              {/* Left: Mobile Menu Button + Shop Name + Logo */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                {mobileMenuButton && (
                  <div className="lg:hidden flex-shrink-0">
                    {mobileMenuButton}
                  </div>
                )}
                <div className="flex items-center gap-0.5 sm:gap-1.5 min-w-0">
                  {shopName && (
                    <h1 className="hidden sm:block text-base md:text-xl lg:text-2xl font-bold text-gray-900 capitalize truncate">{shopName}</h1>
                  )}
                  <div className="flex-shrink-0">
                    <Logo variant="full" size="lg" theme="dark" />
                  </div>
                  {/* Mobile Search Button - right next to logo */}
                  {mobileSearchButton && (
                    <div className="md:hidden flex-shrink-0">
                      {mobileSearchButton}
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Custom Content (e.g., search bar) */}
              {centerContent && (
                <div className="hidden md:flex flex-1 max-w-2xl">
                  {centerContent}
                </div>
              )}

              {/* Right: Auth Buttons, Custom Actions, or Language Selector */}
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
                {rightActions ? (
                  <>
                    {showLanguageSelector && (
                      <div className="flex-shrink-0">
                        <LanguageSelector variant="micro" showLabel={false} />
                      </div>
                    )}
                    {rightActions}
                  </>
                ) : showAuthButtons ? (
                  <>
                    <Link
                      to="/login"
                      className="px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 hover:text-gray-900 font-semibold transition-colors"
                    >
                      <T tKey="navigation.login" />
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-bold bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 transition-all"
                    >
                      <T tKey="landing.nav.getStarted" />
                    </Link>
                    <div className="ml-2">
                      <LanguageSelector variant="micro" showLabel={false} />
                    </div>
                  </>
                ) : (
                  <LanguageSelector variant="micro" showLabel={false} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default LandingHeader;

