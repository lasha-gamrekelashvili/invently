import React from 'react';
import { Link } from 'react-router-dom';
import { T } from './Translation';
import LanguageSelector from './LanguageSelector';
import Logo from './Logo';

interface LandingHeaderProps {
  showAuthButtons?: boolean;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({
  showAuthButtons = false,
}) => {
  return (
    <nav className="bg-gray-100 border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Logo variant="full" size="lg" theme="dark" />
          </div>

          {/* Right: Auth Buttons or Language Selector */}
          <div className="flex items-center gap-3">
            {showAuthButtons ? (
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
        </div>
      </div>
    </nav>
  );
};

export default LandingHeader;

