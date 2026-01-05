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
  showLogo?: boolean;
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
  showLogo = true,
}) => {
  return (
    <nav className="bg-gray-100 border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="w-full px-2 sm:px-4 lg:px-12">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20 gap-1 sm:gap-2 md:gap-4">
          {/* Mobile Search Expanded View */}
          {mobileSearchExpanded && mobileSearchContent ? (
            <div className="flex-1 md:hidden">
              {mobileSearchContent}
            </div>
          ) : (
            <>
              {/* Left: Mobile Menu Button + Shop Name + Logo */}
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0 min-w-0">
                {mobileMenuButton && (
                  <div className="lg:hidden flex-shrink-0">
                    {mobileMenuButton}
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {shopName && (
                    <h1 className="text-base md:text-xl lg:text-2xl font-bold text-gray-900 capitalize truncate">{shopName}</h1>
                  )}
                  {showLogo && (
                    <div className="flex-shrink-0">
                      {/* Use smaller logo on mobile */}
                      <div className="block sm:hidden">
                        <Logo variant="full" size="sm" theme="dark" />
                      </div>
                      <div className="hidden sm:block">
                        <Logo variant="full" size="lg" theme="dark" />
                      </div>
                    </div>
                  )}
                  {/* Mobile Search Button */}
                  {!showLogo && mobileSearchButton && (
                    <div className="md:hidden flex-shrink-0">
                      {mobileSearchButton}
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Custom Content (e.g., search bar) */}
              {centerContent && (
                <div className="flex flex-1 max-w-2xl min-w-0">
                  {centerContent}
                </div>
              )}

              {/* Right: Auth Buttons, Custom Actions, or Language Selector */}
              <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-3 flex-shrink-0">
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
                      className="hidden xs:inline-block px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base text-gray-700 hover:text-gray-900 font-semibold transition-colors whitespace-nowrap"
                    >
                      <T tKey="navigation.login" />
                    </Link>
                    <Link
                      to="/register"
                      className="px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base font-bold bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 transition-all whitespace-nowrap"
                    >
                      <span className="hidden xs:inline"><T tKey="landing.nav.getStarted" /></span>
                      <span className="xs:hidden">Start</span>
                    </Link>
                    <div className="flex-shrink-0">
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

