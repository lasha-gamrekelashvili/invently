import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import { UpdateStoreSettingsData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { CogIcon, DocumentTextIcon, LinkIcon, BoltIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'social' | 'links'>('content');
  const [formData, setFormData] = useState<UpdateStoreSettingsData>({});

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
    updateSettingsMutation.mutate(formData);
  };

  const tabs = [
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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2 inline" />
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateSettingsMutation.isPending ? t('settings.actions.saving') : t('settings.actions.saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
