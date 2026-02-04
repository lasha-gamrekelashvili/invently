import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, authAPI, getCurrentSubdomain } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { UpdateStoreSettingsData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import StorefrontPreview, { StorefrontProductPreview } from '../components/StorefrontPreview';
import { CogIcon, DocumentTextIcon, LinkIcon, BoltIcon, UserCircleIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

const defaultAppearance: UpdateStoreSettingsData = {
  backgroundColor: '#fafafa',
  sidebarBackgroundColor: '#f5f5f5',
  sidebarSelectedColor: '#e5e5e5',
  sidebarHoverColor: '#e5e5e580',
  cardInfoBackgroundColor: '#fafafa',
  headerBackgroundColor: '#ffffff',
  headerTextColor: '#171717',
  headerBorderColor: '#e5e5e5',
  searchBarBackgroundColor: '#ffffff',
  searchBarBorderColor: '#d4d4d4',
  searchBarTextColor: '#171717',
  searchBarPlaceholderColor: '#a3a3a3',
  searchBarIconColor: '#a3a3a3',
  sidebarTextColor: '#525252',
  sidebarSelectedTextColor: '#171717',
  sidebarHeadingColor: '#737373',
  sidebarDividerColor: '#e5e5e5',
  sidebarBorderColor: '#e5e5e5',
  productCardBorderColor: '#e5e5e5',
  productCardHoverBorderColor: '#d4d4d4',
  productCardTextColor: '#171717',
  productCardCategoryTextColor: '#737373',
  productCardPriceTextColor: '#171717',
  buttonPrimaryBackgroundColor: '#171717',
  buttonPrimaryTextColor: '#ffffff',
  buttonSecondaryBackgroundColor: '#ffffff',
  buttonSecondaryTextColor: '#171717',
  buttonSecondaryBorderColor: '#171717',
  linkColor: '#525252',
  linkHoverColor: '#171717',
  footerBackgroundColor: '#ffffff',
  footerTextColor: '#171717',
  footerHeadingColor: '#171717',
  footerLinkColor: '#525252',
  categorySectionTitleColor: '#171717',
  categorySectionAccentColor: '#171717',
  categorySectionLinkColor: '#525252',
  categorySectionLinkHoverColor: '#171717',
  categorySectionBorderColor: '#e5e5e5',
  breadcrumbTextColor: '#525252',
  breadcrumbActiveTextColor: '#171717',
  breadcrumbHoverColor: '#171717',
  breadcrumbIconColor: '#a3a3a3',
  productDetailCardBackgroundColor: '#ffffff',
};

const Settings = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'social' | 'links' | 'account' | 'appearance'>('account');
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
  const [previewType, setPreviewType] = useState<'storefront' | 'product'>('storefront');

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
      handleApiError(error, 'Failed to update settings');
    },
  });

  // Update IBAN mutation
  const updateIbanMutation = useMutation({
    mutationFn: authAPI.updateIban,
    onSuccess: (data) => {
      handleSuccess('IBAN updated successfully');
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Update local state
      setIban(data.user.iban || '');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update IBAN');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (data) => {
      handleSuccess('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Update local state
      setProfileData({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        email: data.user.email || '',
      });
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update profile');
    },
  });

  // Update tenant subdomain mutation
  const updateSubdomainMutation = useMutation({
    mutationFn: settingsAPI.updateTenantSubdomain,
    onSuccess: (data) => {
      handleSuccess('Subdomain updated successfully. Please note: You will need to access your store using the new subdomain URL.');
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Update local state - data is already unwrapped by interceptor
      if (data.tenant) {
        setSubdomain(data.tenant.subdomain || '');
      }
    },
    onError: (error) => {
      handleApiError(error, 'Failed to update subdomain');
    },
  });

  // Send password reset code mutation
  const sendPasswordResetCodeMutation = useMutation({
    mutationFn: authAPI.sendPasswordResetCode,
    onSuccess: () => {
      handleSuccess('Password reset code sent to your email');
      setPasswordChangeStep('code-sent');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to send password reset code');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ code, newPassword }: { code: string; newPassword: string }) =>
      authAPI.changePassword(code, newPassword),
    onSuccess: () => {
      handleSuccess('Password changed successfully');
      setPasswordChangeStep('idle');
      setPasswordCode('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      handleApiError(error, 'Failed to change password');
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

  const handleResetAppearance = () => {
    // Get non-appearance fields from current formData
    const {
      backgroundColor, sidebarBackgroundColor, sidebarSelectedColor, sidebarHoverColor,
      cardInfoBackgroundColor, headerBackgroundColor, headerTextColor, headerBorderColor,
      searchBarBackgroundColor, searchBarBorderColor, searchBarTextColor, searchBarPlaceholderColor,
      searchBarIconColor, sidebarTextColor, sidebarSelectedTextColor, sidebarHeadingColor,
      sidebarDividerColor, sidebarBorderColor, productCardBorderColor, productCardHoverBorderColor,
      productCardTextColor, productCardCategoryTextColor, productCardPriceTextColor,
      buttonPrimaryBackgroundColor, buttonPrimaryTextColor, buttonSecondaryBackgroundColor,
      buttonSecondaryTextColor, buttonSecondaryBorderColor, linkColor, linkHoverColor,
      footerBackgroundColor, footerTextColor, footerHeadingColor, footerLinkColor,
      categorySectionTitleColor, categorySectionAccentColor, categorySectionLinkColor,
      categorySectionLinkHoverColor, categorySectionBorderColor, breadcrumbTextColor,
      breadcrumbActiveTextColor, breadcrumbHoverColor, breadcrumbIconColor,
      productDetailCardBackgroundColor,
      ...nonAppearanceFields
    } = formData;
    
    // Reset to defaults: keep non-appearance fields, replace appearance fields with defaults
    setFormData({
      ...nonAppearanceFields,
      ...defaultAppearance
    });
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
    { id: 'appearance', name: t('settings.tabs.appearance'), icon: PaintBrushIcon },
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

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{t('settings.appearance.title')}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('settings.appearance.description')}
              </p>
            </div>

            {/* Two Column Layout: Preview on right, Colors on left */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Color Settings - Takes 2 columns */}
              <div className="lg:col-span-3">
                <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 appearance-color-settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.appearance.backgroundColor.label')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.backgroundColor || '#fafafa'}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor || '#fafafa'}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="flex-1 input-field"
                      placeholder="#fafafa"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.backgroundColor.description')}</p>
                </div>

                {/* Sidebar Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.appearance.sidebarBackgroundColor.label')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.sidebarBackgroundColor || '#f5f5f5'}
                      onChange={(e) => setFormData({ ...formData, sidebarBackgroundColor: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.sidebarBackgroundColor || '#f5f5f5'}
                      onChange={(e) => setFormData({ ...formData, sidebarBackgroundColor: e.target.value })}
                      className="flex-1 input-field"
                      placeholder="#f5f5f5"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.sidebarBackgroundColor.description')}</p>
                </div>

                {/* Sidebar Selected Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.appearance.sidebarSelectedColor.label')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.sidebarSelectedColor || '#e5e5e5'}
                      onChange={(e) => setFormData({ ...formData, sidebarSelectedColor: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.sidebarSelectedColor || '#e5e5e5'}
                      onChange={(e) => setFormData({ ...formData, sidebarSelectedColor: e.target.value })}
                      className="flex-1 input-field"
                      placeholder="#e5e5e5"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.sidebarSelectedColor.description')}</p>
                </div>

                {/* Sidebar Hover Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.appearance.sidebarHoverColor.label')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.sidebarHoverColor || '#e5e5e580'}
                      onChange={(e) => setFormData({ ...formData, sidebarHoverColor: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.sidebarHoverColor || '#e5e5e580'}
                      onChange={(e) => setFormData({ ...formData, sidebarHoverColor: e.target.value })}
                      className="flex-1 input-field"
                      placeholder="#e5e5e580"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.sidebarHoverColor.description')}</p>
                </div>

                {/* Card Info Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.appearance.cardInfoBackgroundColor.label')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.cardInfoBackgroundColor || '#fafafa'}
                      onChange={(e) => setFormData({ ...formData, cardInfoBackgroundColor: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.cardInfoBackgroundColor || '#fafafa'}
                      onChange={(e) => setFormData({ ...formData, cardInfoBackgroundColor: e.target.value })}
                      className="flex-1 input-field"
                      placeholder="#fafafa"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.cardInfoBackgroundColor.description')}</p>
                </div>
              </div>

              {/* Header Colors Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Header Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Background</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.headerBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, headerBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.headerBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, headerBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Background color of the storefront header</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.headerTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, headerTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.headerTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, headerTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for header elements</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Border</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.headerBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, headerBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.headerBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, headerBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Border color at the bottom of the header</p>
                  </div>
                </div>
              </div>

              {/* Search Bar Colors Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Search Bar Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Bar Background</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.searchBarBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, searchBarBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.searchBarBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, searchBarBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Background color of the search input field</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Bar Border</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.searchBarBorderColor || '#d4d4d4'} onChange={(e) => setFormData({ ...formData, searchBarBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.searchBarBorderColor || '#d4d4d4'} onChange={(e) => setFormData({ ...formData, searchBarBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#d4d4d4" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Border color around the search input field</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Bar Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.searchBarTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, searchBarTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.searchBarTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, searchBarTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for typed search queries</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Bar Placeholder</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.searchBarPlaceholderColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, searchBarPlaceholderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.searchBarPlaceholderColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, searchBarPlaceholderColor: e.target.value })} className="flex-1 input-field" placeholder="#a3a3a3" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Placeholder text color in the search field</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Bar Icon</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.searchBarIconColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, searchBarIconColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.searchBarIconColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, searchBarIconColor: e.target.value })} className="flex-1 input-field" placeholder="#a3a3a3" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Color of the search icon inside the search field</p>
                  </div>
                </div>
              </div>

              {/* Sidebar Text & Border Colors Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Sidebar Text & Borders</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.sidebarTextColor || '#525252'} onChange={(e) => setFormData({ ...formData, sidebarTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.sidebarTextColor || '#525252'} onChange={(e) => setFormData({ ...formData, sidebarTextColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for category items in the sidebar</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Selected Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.sidebarSelectedTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, sidebarSelectedTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.sidebarSelectedTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, sidebarSelectedTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for the currently selected category</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Heading</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.sidebarHeadingColor || '#737373'} onChange={(e) => setFormData({ ...formData, sidebarHeadingColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.sidebarHeadingColor || '#737373'} onChange={(e) => setFormData({ ...formData, sidebarHeadingColor: e.target.value })} className="flex-1 input-field" placeholder="#737373" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for sidebar section headings</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Divider</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.sidebarDividerColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, sidebarDividerColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.sidebarDividerColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, sidebarDividerColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Color of divider lines between sidebar sections</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Border</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.sidebarBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, sidebarBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.sidebarBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, sidebarBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Border color on the right edge of the sidebar</p>
                  </div>
                </div>
              </div>

              {/* Product Card Colors Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Product Card Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Border</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.productCardBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, productCardBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.productCardBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, productCardBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Border color around product cards</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Hover Border</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.productCardHoverBorderColor || '#d4d4d4'} onChange={(e) => setFormData({ ...formData, productCardHoverBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.productCardHoverBorderColor || '#d4d4d4'} onChange={(e) => setFormData({ ...formData, productCardHoverBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#d4d4d4" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Border color when hovering over product cards</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.productCardTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, productCardTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.productCardTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, productCardTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for product names on cards</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Category Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.productCardCategoryTextColor || '#737373'} onChange={(e) => setFormData({ ...formData, productCardCategoryTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.productCardCategoryTextColor || '#737373'} onChange={(e) => setFormData({ ...formData, productCardCategoryTextColor: e.target.value })} className="flex-1 input-field" placeholder="#737373" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for category labels on product cards</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Price Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.productCardPriceTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, productCardPriceTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.productCardPriceTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, productCardPriceTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for product prices on cards</p>
                  </div>
                </div>
              </div>

              {/* Button Colors Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Button Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Button Background</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.buttonPrimaryBackgroundColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonPrimaryBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.buttonPrimaryBackgroundColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonPrimaryBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Background color for primary action buttons</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Button Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.buttonPrimaryTextColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, buttonPrimaryTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.buttonPrimaryTextColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, buttonPrimaryTextColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for primary action buttons</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Button Background</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.buttonSecondaryBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, buttonSecondaryBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.buttonSecondaryBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, buttonSecondaryBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Background color for secondary action buttons</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Button Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.buttonSecondaryTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonSecondaryTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.buttonSecondaryTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonSecondaryTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for secondary action buttons</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Button Border</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.buttonSecondaryBorderColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonSecondaryBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.buttonSecondaryBorderColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonSecondaryBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Border color for secondary action buttons</p>
                  </div>
                </div>
              </div>

              {/* Link Colors Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Link Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.linkColor || '#525252'} onChange={(e) => setFormData({ ...formData, linkColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.linkColor || '#525252'} onChange={(e) => setFormData({ ...formData, linkColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Default color for clickable links</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link Hover Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.linkHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, linkHoverColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.linkHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, linkHoverColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Color for links when hovering over them</p>
                  </div>
                </div>
              </div>

              {/* Footer Colors Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Footer Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Footer Background</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.footerBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, footerBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.footerBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, footerBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Background color of the storefront footer</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Footer Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.footerTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.footerTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for footer content</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Footer Heading</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.footerHeadingColor || '#171717'} onChange={(e) => setFormData({ ...formData, footerHeadingColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.footerHeadingColor || '#171717'} onChange={(e) => setFormData({ ...formData, footerHeadingColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for footer section headings</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Footer Link</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.footerLinkColor || '#525252'} onChange={(e) => setFormData({ ...formData, footerLinkColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.footerLinkColor || '#525252'} onChange={(e) => setFormData({ ...formData, footerLinkColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Color for links in the footer</p>
                  </div>
                </div>
              </div>

              {/* Category Section Colors */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Category Section Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Title</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.categorySectionTitleColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionTitleColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.categorySectionTitleColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionTitleColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for category section titles</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Accent Bar</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.categorySectionAccentColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionAccentColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.categorySectionAccentColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionAccentColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Color of the accent bar next to category titles</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">View All Link</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.categorySectionLinkColor || '#525252'} onChange={(e) => setFormData({ ...formData, categorySectionLinkColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.categorySectionLinkColor || '#525252'} onChange={(e) => setFormData({ ...formData, categorySectionLinkColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Color for "View All" links in category sections</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">View All Link Hover</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.categorySectionLinkHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionLinkHoverColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.categorySectionLinkHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionLinkHoverColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Color for "View All" links when hovering</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Border</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.categorySectionBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, categorySectionBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.categorySectionBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, categorySectionBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Border color separating category sections</p>
                  </div>
                </div>
              </div>

              {/* Product Detail Card Settings */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Product Detail Card</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Background Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.productDetailCardBackgroundColor || '#ffffff'}
                        onChange={(e) => setFormData({ ...formData, productDetailCardBackgroundColor: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.productDetailCardBackgroundColor || '#ffffff'}
                        onChange={(e) => setFormData({ ...formData, productDetailCardBackgroundColor: e.target.value })}
                        className="flex-1 input-field"
                        placeholder="#ffffff"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Background color of the product detail card</p>
                  </div>
                </div>
              </div>

              {/* Breadcrumb Colors */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Breadcrumb Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breadcrumb Text</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.breadcrumbTextColor || '#525252'} onChange={(e) => setFormData({ ...formData, breadcrumbTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.breadcrumbTextColor || '#525252'} onChange={(e) => setFormData({ ...formData, breadcrumbTextColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for breadcrumb navigation links</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breadcrumb Active</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.breadcrumbActiveTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, breadcrumbActiveTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.breadcrumbActiveTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, breadcrumbActiveTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color for the current page in breadcrumbs</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breadcrumb Hover</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.breadcrumbHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, breadcrumbHoverColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.breadcrumbHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, breadcrumbHoverColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Text color when hovering over breadcrumb links</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breadcrumb Icon</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={formData.breadcrumbIconColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, breadcrumbIconColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={formData.breadcrumbIconColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, breadcrumbIconColor: e.target.value })} className="flex-1 input-field" placeholder="#a3a3a3" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Color of separator icons between breadcrumb items</p>
                  </div>
                </div>
              </div>
                </div>
              </div>

              {/* Live Preview - Sticky on right */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-6">
                  {/* Preview Type Switcher */}
                  <div className="mb-4 flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewType('storefront')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        previewType === 'storefront'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Storefront
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewType('product')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        previewType === 'product'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Product Detail
                    </button>
                  </div>
                  
                  {/* Preview Content */}
                  {previewType === 'storefront' ? (
                    <StorefrontPreview 
                      colors={formData} 
                      onReset={handleResetAppearance}
                    />
                  ) : (
                    <StorefrontProductPreview 
                      colors={formData} 
                      onReset={handleResetAppearance}
                    />
                  )}
                  
                  {/* Save Button - Always near preview */}
                  <div className="mt-4 flex justify-end">
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
                </div>
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
                <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
                {passwordChangeStep === 'idle' && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      To change your password, we'll send a verification code to your email address.
                    </p>
                    <button
                      type="button"
                      onClick={() => sendPasswordResetCodeMutation.mutate()}
                      disabled={sendPasswordResetCodeMutation.isPending}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendPasswordResetCodeMutation.isPending ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  </div>
                )}

                {passwordChangeStep === 'code-sent' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      We've sent a verification code to your email. Please enter it below along with your new password.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={passwordCode}
                        onChange={(e) => setPasswordCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="input-field"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field"
                        placeholder="Enter new password"
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field"
                        placeholder="Confirm new password"
                        minLength={8}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (newPassword !== confirmPassword) {
                            handleApiError({ message: 'Passwords do not match' }, 'Passwords do not match');
                            return;
                          }
                          if (passwordCode.length !== 6) {
                            handleApiError({ message: 'Please enter a valid 6-digit code' }, 'Invalid code');
                            return;
                          }
                          setPasswordChangeStep('verifying');
                          changePasswordMutation.mutate({ code: passwordCode, newPassword });
                        }}
                        disabled={changePasswordMutation.isPending || passwordCode.length !== 6 || !newPassword || !confirmPassword}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
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
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button - For tabs without preview */}
        {activeTab !== 'appearance' && (
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
        )}
      </form>
    </div>
  );
};

export default Settings;
