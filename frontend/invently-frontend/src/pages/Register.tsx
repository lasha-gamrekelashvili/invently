import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';
import { T } from '../components/Translation';
import LandingHeader from '../components/LandingHeader';
import { EnvelopeIcon, LockClosedIcon, UserIcon, BuildingStorefrontIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantName: '',
    subdomain: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register: registerUser } = useAuth();
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate subdomain from tenant name
    if (name === 'tenantName') {
      const subdomain = value.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 20);
      setFormData(prev => ({ ...prev, subdomain }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      const errorMessage = t('auth.errors.passwordsDoNotMatch');
      setError(errorMessage);
      handleApiError({ message: errorMessage }, errorMessage);
      return;
    }

    if (formData.subdomain.length < 3) {
      const errorMessage = 'Subdomain must be at least 3 characters long';
      setError(errorMessage);
      handleApiError({ message: errorMessage }, errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await registerUser(registerData);
      handleSuccess('Registration successful! Welcome to Shopu!');
      // AuthContext will handle the redirect automatically
    } catch (err: any) {
      const errorMessage = handleApiError(err, 'Registration failed. Please try again.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation */}
      <LandingHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            <T tKey="auth.register.heroTitle" />{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              <T tKey="auth.register.heroTitleHighlight" />
            </span>
            {' '}<T tKey="auth.register.heroTitleEnd" />
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            <T tKey="auth.register.heroDescription" />
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                    <T tKey="auth.register.firstName" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t('auth.register.firstName')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                    <T tKey="auth.register.lastName" />
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t('auth.register.lastName')}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  <T tKey="auth.register.email" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={t('auth.register.email')}
                  />
                </div>
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="tenantName" className="block text-sm font-semibold text-gray-700 mb-2">
                  <T tKey="auth.register.tenantName" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="tenantName"
                    name="tenantName"
                    type="text"
                    required
                    value={formData.tenantName}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={t('auth.register.tenantName')}
                  />
                </div>
              </div>

              {/* Subdomain */}
              <div>
                <label htmlFor="subdomain" className="block text-sm font-semibold text-gray-700 mb-2">
                  <T tKey="auth.register.subdomain" />
                </label>
                <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="subdomain"
                      name="subdomain"
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3 border-0 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                      placeholder={t('auth.register.subdomainPlaceholder')}
                      pattern="[a-z0-9]+"
                      title="Only lowercase letters and numbers allowed"
                    />
                  </div>
                  <span className="inline-flex items-center px-4 bg-gray-50 text-gray-700 text-sm font-medium border-l border-gray-300">
                    .shopu.ge
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  <T tKey="auth.register.subdomainHelp" />
                </p>
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  <T tKey="auth.register.password" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={t('auth.register.password')}
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  <T tKey="auth.register.confirmPassword" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={t('auth.register.confirmPassword')}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-semibold text-base hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <T tKey="auth.register.createAccountButton" />
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                <T tKey="auth.register.hasAccount" />{' '}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <T tKey="auth.register.signInLink" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-100 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 Shopu.ge
          </p>
          <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
            <T tKey="legal.footer.backToHome" />
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Register;
