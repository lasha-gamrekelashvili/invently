import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, authAPI, getCurrentSubdomain } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { UpdateStoreSettingsData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { CogIcon, DocumentTextIcon, LinkIcon, BoltIcon, UserCircleIcon } from '@heroicons/react/24/outline';


const Settings = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'social' | 'links' | 'account'>('account');
  const [formData, setFormData] = useState<UpdateStoreSettingsData>({});
  const [iban, setIban] = useState(user?.iban || '');
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [subdomain, setSubdomain] = useState(getCurrentSubdomain() || '');
  const [passwordChangeStep, setPasswordChangeStep] = useState<'idle' | 'code-sent' | 'verifying'>('idle');
  const [passwordCode, setPasswordCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch settings
  const { data: settingsResponse, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsAPI.getSettings,
  });

  // Pre-fill form data when settings are loaded
  useEffect(() => {
    if (settingsResponse) {
      setFormData(settingsResponse);
    }
  }, [settingsResponse]);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
      setIban(user.iban || '');
    }
  }, [user]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: settingsAPI.updateSettings,
    onSuccess: (data) => {
      handleSuccess(data.message);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      handleApiError(error, t('settings.messages.updateSettingsError'));
    },
  });

  // Update IBAN mutation
  const updateIbanMutation = useMutation({
    mutationFn: authAPI.updateIban,
    onSuccess: (data) => {
      handleSuccess(t('settings.messages.ibanUpdated'));
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Update local state
      setIban(data.user.iban || '');
    },
    onError: (error) => {
      handleApiError(error, t('settings.messages.updateIbanError'));
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (data) => {
      handleSuccess(t('settings.messages.profileUpdated'));
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Update local state
      setProfileData({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        email: data.user.email || '',
      });
    },
    onError: (error) => {
      handleApiError(error, t('settings.messages.updateProfileError'));
    },
  });

  // Update tenant subdomain mutation
  const updateSubdomainMutation = useMutation({
    mutationFn: settingsAPI.updateTenantSubdomain,
    onSuccess: (data) => {
      handleSuccess(t('settings.messages.subdomainUpdated'));
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Update local state - data is already unwrapped by interceptor
      if (data.tenant) {
        setSubdomain(data.tenant.subdomain || '');
      }
    },
    onError: (error) => {
      handleApiError(error, t('settings.messages.updateSubdomainError'));
    },
  });

  // Send password reset code mutation
  const sendPasswordResetCodeMutation = useMutation({
    mutationFn: authAPI.sendPasswordResetCode,
    onSuccess: () => {
      handleSuccess(t('settings.account.password.resetCodeSent'));
      setPasswordChangeStep('code-sent');
    },
    onError: (error) => {
      handleApiError(error, t('settings.messages.sendResetCodeError'));
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ code, newPassword }: { code: string; newPassword: string }) =>
      authAPI.changePassword(code, newPassword),
    onSuccess: () => {
      handleSuccess(t('settings.messages.passwordChanged'));
      setPasswordChangeStep('idle');
      setPasswordCode('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      handleApiError(error, t('settings.messages.changePasswordError'));
      setPasswordChangeStep('code-sent');
    },
  });

  const handleInputChange = (field: keyof UpdateStoreSettingsData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContentChange = (field: keyof UpdateStoreSettingsData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as any || {}),
        content: value
      }
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'account') {
      // Update profile, IBAN, and subdomain if they've changed
      const profileUpdates: { firstName?: string; lastName?: string; email?: string } = {};
      if (profileData.firstName !== user?.firstName) profileUpdates.firstName = profileData.firstName;
      if (profileData.lastName !== user?.lastName) profileUpdates.lastName = profileData.lastName;
      if (profileData.email !== user?.email) profileUpdates.email = profileData.email;

      const hasProfileChanges = Object.keys(profileUpdates).length > 0;
      const hasIbanChange = iban !== (user?.iban || '');
      const currentSubdomain = getCurrentSubdomain();
      const hasSubdomainChange = subdomain && subdomain !== currentSubdomain;

      // Collect all mutations
      const mutations: Promise<any>[] = [];
      
      if (hasProfileChanges) {
        mutations.push(updateProfileMutation.mutateAsync(profileUpdates));
      }
      if (hasIbanChange) {
        mutations.push(updateIbanMutation.mutateAsync(iban));
      }
      if (hasSubdomainChange) {
        mutations.push(updateSubdomainMutation.mutateAsync(subdomain));
      }

      if (mutations.length > 0) {
        Promise.all(mutations).catch(() => {
          // Errors are handled in individual mutations
        });
      }
    } else {
      updateSettingsMutation.mutate(formData);
    }
  };

  const tabs = [
    { id: 'account', name: t('settings.tabs.account'), icon: UserCircleIcon },
    { id: 'content', name: t('settings.tabs.content'), icon: DocumentTextIcon },
    { id: 'social', name: t('settings.tabs.social'), icon: LinkIcon },
    { id: 'links', name: t('settings.tabs.links'), icon: BoltIcon },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        icon={CogIcon}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto overflow-y-hidden">
        <nav className="-mb-px flex space-x-8 min-w-max pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2 flex-shrink-0" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Page Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">{t('settings.content.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('settings.content.description')}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* About Us */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.content.aboutUs.title')}</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.content.aboutUs.contentLabel')}
                </label>
                <textarea
                  value={formData.aboutUs?.content || ''}
                  onChange={(e) => handleContentChange('aboutUs', e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder={t('settings.content.aboutUs.placeholder')}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.content.contact.title')}</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.content.contact.contentLabel')}
                </label>
                <textarea
                  value={formData.contact?.content || ''}
                  onChange={(e) => handleContentChange('contact', e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder={t('settings.content.contact.placeholder')}
                />
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.content.privacyPolicy.title')}</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.content.privacyPolicy.contentLabel')}
                </label>
                <textarea
                  value={formData.privacyPolicy?.content || ''}
                  onChange={(e) => handleContentChange('privacyPolicy', e.target.value)}
                  rows={6}
                  className="input-field"
                  placeholder={t('settings.content.privacyPolicy.placeholder')}
                />
              </div>
            </div>

            {/* Terms of Service */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.content.termsOfService.title')}</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.content.termsOfService.contentLabel')}
                </label>
                <textarea
                  value={formData.termsOfService?.content || ''}
                  onChange={(e) => handleContentChange('termsOfService', e.target.value)}
                  rows={6}
                  className="input-field"
                  placeholder={t('settings.content.termsOfService.placeholder')}
                />
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.content.shippingInfo.title')}</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.content.shippingInfo.contentLabel')}
                </label>
                <textarea
                  value={formData.shippingInfo?.content || ''}
                  onChange={(e) => handleContentChange('shippingInfo', e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder={t('settings.content.shippingInfo.placeholder')}
                />
              </div>
            </div>

            {/* Returns */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.content.returns.title')}</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.content.returns.contentLabel')}
                </label>
                <textarea
                  value={formData.returns?.content || ''}
                  onChange={(e) => handleContentChange('returns', e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder={t('settings.content.returns.placeholder')}
                />
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.content.faq.title')}</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.content.faq.contentLabel')}
                </label>
                <textarea
                  value={formData.faq?.content || ''}
                  onChange={(e) => handleContentChange('faq', e.target.value)}
                  rows={6}
                  className="input-field"
                  placeholder={t('settings.content.faq.placeholder')}
                />
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">{t('settings.social.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('settings.social.description')}
            </p>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.social.facebook.label')}
                  </label>
                  <input
                    type="url"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                    className="input-field"
                    placeholder={t('settings.social.facebook.placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.social.twitter.label')}
                  </label>
                  <input
                    type="url"
                    value={formData.twitterUrl || ''}
                    onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                    className="input-field"
                    placeholder={t('settings.social.twitter.placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.social.instagram.label')}
                  </label>
                  <input
                    type="url"
                    value={formData.instagramUrl || ''}
                    onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                    className="input-field"
                    placeholder={t('settings.social.instagram.placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.social.linkedin.label')}
                  </label>
                  <input
                    type="url"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                    className="input-field"
                    placeholder={t('settings.social.linkedin.placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.social.youtube.label')}
                  </label>
                  <input
                    type="url"
                    value={formData.youtubeUrl || ''}
                    onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                    className="input-field"
                    placeholder={t('settings.social.youtube.placeholder')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">{t('settings.links.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('settings.links.description')}
            </p>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.links.trackOrder.label')}
                </label>
                <input
                  type="url"
                  value={formData.trackOrderUrl || ''}
                  onChange={(e) => handleInputChange('trackOrderUrl', e.target.value)}
                  className="input-field"
                  placeholder={t('settings.links.trackOrder.placeholder')}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t('settings.links.trackOrder.helpText')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">{t('settings.account.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('settings.account.description')}
            </p>

            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
              {/* Profile Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.account.profile.title')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.account.profile.firstName.label')}
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="input-field"
                      placeholder={t('settings.account.profile.firstName.placeholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.account.profile.lastName.label')}
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="input-field"
                      placeholder={t('settings.account.profile.lastName.placeholder')}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.account.profile.email.label')}
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="input-field"
                      placeholder={t('settings.account.profile.email.placeholder')}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {t('settings.account.profile.email.helpText')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shop Information */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.account.shop.title')}</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.account.shop.subdomain.label')}
                  </label>
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="input-field"
                    placeholder={t('settings.account.shop.subdomain.placeholder')}
                    pattern="[a-z0-9]+"
                    minLength={3}
                    maxLength={50}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('settings.account.shop.subdomain.helpText')}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.account.payment.title')}</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.account.iban.label')}
                  </label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="input-field"
                    placeholder={t('settings.account.iban.placeholder')}
                    maxLength={34}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('settings.account.iban.helpText')}
                  </p>
                </div>
              </div>

              {/* Password Change */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.account.password.title')}</h4>
                {passwordChangeStep === 'idle' && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('settings.account.password.description')}
                    </p>
                    <button
                      type="button"
                      onClick={() => sendPasswordResetCodeMutation.mutate()}
                      disabled={sendPasswordResetCodeMutation.isPending}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendPasswordResetCodeMutation.isPending ? t('settings.account.password.sending') : t('settings.account.password.sendCode')}
                    </button>
                  </div>
                )}

                {passwordChangeStep === 'code-sent' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {t('settings.account.password.codeSent')}
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.account.password.verificationCode.label')}
                      </label>
                      <input
                        type="text"
                        value={passwordCode}
                        onChange={(e) => setPasswordCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="input-field"
                        placeholder={t('settings.account.password.verificationCode.placeholder')}
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.account.password.newPassword.label')}
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field"
                        placeholder={t('settings.account.password.newPassword.placeholder')}
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.account.password.confirmPassword.label')}
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field"
                        placeholder={t('settings.account.password.confirmPassword.placeholder')}
                        minLength={8}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (newPassword !== confirmPassword) {
                            handleApiError({ message: t('settings.messages.passwordsNotMatch') }, t('settings.messages.passwordsNotMatch'));
                            return;
                          }
                          if (passwordCode.length !== 6) {
                            handleApiError({ message: t('settings.messages.invalidCode') }, t('settings.messages.invalidCode'));
                            return;
                          }
                          setPasswordChangeStep('verifying');
                          changePasswordMutation.mutate({ code: passwordCode, newPassword });
                        }}
                        disabled={changePasswordMutation.isPending || passwordCode.length !== 6 || !newPassword || !confirmPassword}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {changePasswordMutation.isPending ? t('settings.account.password.changing') : t('settings.account.password.changeButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordChangeStep('idle');
                          setPasswordCode('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="btn-secondary"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending || updateIbanMutation.isPending || updateProfileMutation.isPending || updateSubdomainMutation.isPending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(updateSettingsMutation.isPending || updateIbanMutation.isPending || updateProfileMutation.isPending || updateSubdomainMutation.isPending) 
              ? t('settings.actions.saving') 
              : t('settings.actions.saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
