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
                  className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-semibold transition-colors"
                >
                  <T tKey="navigation.login" />
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
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

