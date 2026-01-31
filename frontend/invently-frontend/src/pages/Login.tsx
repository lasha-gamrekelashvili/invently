import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import { T } from '../components/Translation';
import LandingHeader from '../components/LandingHeader';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      handleSuccess(t('auth.login.successMessage'));
      // AuthContext will handle the redirect automatically
    } catch (err: any) {
      const errorMessage = handleApiError(err, t('auth.errors.loginFailed'));
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <LandingHeader />

      {/* Hero Section */}
      <div className="bg-neutral-950 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight tracking-tight">
            <T tKey="auth.login.heroTitle" />{' '}
            <span className="font-medium text-neutral-300">
              <T tKey="auth.login.heroBrand" />
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            <T tKey="auth.login.heroDescription" />
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    <T tKey="auth.login.email" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                      placeholder={t('auth.login.email')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    <T tKey="auth.login.password" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                      placeholder={t('auth.login.password')}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 text-white py-3.5 px-4 rounded-full font-medium text-base hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <T tKey="auth.login.signInButton" />
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                <T tKey="auth.login.noAccount" />{' '}
                <Link
                  to="/register"
                  className="font-medium text-neutral-900 hover:text-neutral-700 transition-colors"
                >
                  <T tKey="auth.login.signUpLink" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-neutral-400 text-sm">
            © 2025 Shopu.ge
          </p>
          <Link to="/" className="text-neutral-500 hover:text-neutral-900 text-sm font-medium transition-colors">
            <T tKey="legal.footer.backToHome" />
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Login;
