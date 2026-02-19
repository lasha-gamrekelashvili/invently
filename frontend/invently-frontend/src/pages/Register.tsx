import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { authAPI } from '../utils/api';
import { useMutation } from '@tanstack/react-query';
import LoadingSpinner from '../components/LoadingSpinner';
import { T } from '../components/Translation';
import LandingHeader from '../components/LandingHeader';
import { EnvelopeIcon, LockClosedIcon, BuildingStorefrontIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    tenantName: '',
    subdomain: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registrationResult, setRegistrationResult] = useState<any>(null);

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
      const result = await registerUser(registerData) as any;
      setRegistrationResult(result);
      // Set token for API calls
      if (result?.token) {
        authAPI.setToken(result.token);
      }
      handleSuccess('Registration successful! Please verify your email to continue.');
      setShowEmailVerification(true);
    } catch (err: any) {
      const errorMessage = handleApiError(err, 'Registration failed. Please try again.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: (code: string) => {
      // Ensure token is set
      if (registrationResult?.token) {
        authAPI.setToken(registrationResult.token);
      }
      return authAPI.verifyEmail(code);
    },
    onSuccess: () => {
      handleSuccess('Email verified successfully!');
      // Always redirect to dashboard after email verification
      // User can pay setup fee from the billing page
      if (registrationResult?.tenant) {
        const currentHost = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const token = registrationResult.token;
        const baseUrl =
          currentHost.includes('localhost') || currentHost === '127.0.0.1'
            ? `http://localhost${port}`
            : 'https://shopu.ge';
        window.location.replace(
          `${baseUrl}/${registrationResult.tenant.subdomain}/dashboard#token=${encodeURIComponent(token)}`
        );
      }
    },
    onError: (err: any) => {
      handleApiError(err, 'Failed to verify email. Please check the code and try again.');
    },
  });

  // Resend email confirmation mutation
  const resendEmailMutation = useMutation({
    mutationFn: () => {
      // Ensure token is set
      if (registrationResult?.token) {
        authAPI.setToken(registrationResult.token);
      }
      return authAPI.resendEmailConfirmation();
    },
    onSuccess: () => {
      handleSuccess('Verification code resent to your email');
    },
    onError: (err: any) => {
      handleApiError(err, 'Failed to resend verification code');
    },
  });

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      handleApiError({ message: 'Please enter a valid 6-digit code' }, 'Invalid code');
      return;
    }
    verifyEmailMutation.mutate(verificationCode);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <LandingHeader />

      {/* Hero Section */}
      <div className="bg-neutral-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight tracking-tight">
            <T tKey="auth.register.heroTitle" />{' '}
            <span className="font-medium text-neutral-300">
              <T tKey="auth.register.heroTitleHighlight" />
            </span>
            {' '}<T tKey="auth.register.heroTitleEnd" />
          </h1>
          <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            <T tKey="auth.register.heroDescription" />
          </p>
        </div>
      </div>

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-10 max-w-md w-full">
            <h2 className="text-2xl font-medium text-neutral-900 mb-2">Verify Your Email</h2>
            <p className="text-sm text-neutral-600 mb-6">
              We've sent a verification code to <strong>{formData.email}</strong>. Please enter the code below to continue.
            </p>
            
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-neutral-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={verifyEmailMutation.isPending || verificationCode.length !== 6}
                  className="flex-1 bg-neutral-900 text-white py-3.5 px-4 rounded-full font-medium text-base hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {verifyEmailMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Verify Email'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => resendEmailMutation.mutate()}
                  disabled={resendEmailMutation.isPending}
                  className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
                >
                  {resendEmailMutation.isPending ? 'Sending...' : "Didn't receive the code? Resend"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  <T tKey="auth.register.email" />
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
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    placeholder={t('auth.register.email')}
                  />
                </div>
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="tenantName" className="block text-sm font-medium text-neutral-700 mb-2">
                  <T tKey="auth.register.tenantName" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <BuildingStorefrontIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="tenantName"
                    name="tenantName"
                    type="text"
                    required
                    value={formData.tenantName}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    placeholder={t('auth.register.tenantName')}
                  />
                </div>
              </div>

              {/* Subdomain */}
              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-neutral-700 mb-2">
                  <T tKey="auth.register.subdomain" />
                </label>
                <div className="flex rounded-xl border border-neutral-300 overflow-hidden focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-transparent transition-all">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <GlobeAltIcon className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      id="subdomain"
                      name="subdomain"
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3 border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0"
                      placeholder={t('auth.register.subdomainPlaceholder')}
                      pattern="[a-z0-9]+"
                      title="Only lowercase letters and numbers allowed"
                    />
                  </div>
                  <span className="inline-flex items-center px-4 bg-neutral-50 text-neutral-700 text-sm font-medium border-l border-neutral-300">
                    .shopu.ge
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  <T tKey="auth.register.subdomainHelp" />
                </p>
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  <T tKey="auth.register.password" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    placeholder={t('auth.register.password')}
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  <T tKey="auth.register.confirmPassword" />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    placeholder={t('auth.register.confirmPassword')}
                  />
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
                    <T tKey="auth.register.createAccountButton" />
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                <T tKey="auth.register.hasAccount" />{' '}
                <Link
                  to="/login"
                  className="font-medium text-neutral-900 hover:text-neutral-700 transition-colors"
                >
                  <T tKey="auth.register.signInLink" />
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

export default Register;
