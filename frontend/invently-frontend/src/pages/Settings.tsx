import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { UpdateStoreSettingsData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import { CogIcon, DocumentTextIcon, LinkIcon, BoltIcon } from '@heroicons/react/24/outline';

const Settings = () => {
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
    if (settingsResponse?.data) {
      setFormData(settingsResponse.data);
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
    { id: 'content', name: 'Page Content', icon: DocumentTextIcon },
    { id: 'social', name: 'Social Media', icon: LinkIcon },
    { id: 'links', name: 'Quick Links', icon: BoltIcon },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Settings"
        subtitle="Manage your store's footer content, social media links, and quick links"
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
                  ? 'border-blue-500 text-blue-600'
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
            <h3 className="text-lg font-medium text-gray-900">Page Content</h3>
            <p className="text-sm text-gray-600">
              Manage the content for your store's footer pages. These will be displayed in the storefront footer.
            </p>

            {/* About Us */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">About Us</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.aboutUs?.content || ''}
                  onChange={(e) => handleContentChange('aboutUs', e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Tell customers about your store..."
                />
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.contact?.content || ''}
                  onChange={(e) => handleContentChange('contact', e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Your contact information..."
                />
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Privacy Policy</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.privacyPolicy?.content || ''}
                  onChange={(e) => handleContentChange('privacyPolicy', e.target.value)}
                  rows={6}
                  className="input-field"
                  placeholder="Your privacy policy content..."
                />
              </div>
            </div>

            {/* Terms of Service */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Terms of Service</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.termsOfService?.content || ''}
                  onChange={(e) => handleContentChange('termsOfService', e.target.value)}
                  rows={6}
                  className="input-field"
                  placeholder="Your terms of service content..."
                />
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Shipping Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.shippingInfo?.content || ''}
                  onChange={(e) => handleContentChange('shippingInfo', e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Your shipping information..."
                />
              </div>
            </div>

            {/* Returns */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Returns Policy</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.returns?.content || ''}
                  onChange={(e) => handleContentChange('returns', e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Your returns policy..."
                />
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">FAQ</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.faq?.content || ''}
                  onChange={(e) => handleContentChange('faq', e.target.value)}
                  rows={6}
                  className="input-field"
                  placeholder="Your FAQ content..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Social Media Links</h3>
            <p className="text-sm text-gray-600">
              Add your social media profiles. These will be displayed in the storefront footer.
            </p>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                    className="input-field"
                    placeholder="https://facebook.com/yourstore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter URL
                  </label>
                  <input
                    type="url"
                    value={formData.twitterUrl || ''}
                    onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                    className="input-field"
                    placeholder="https://twitter.com/yourstore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={formData.instagramUrl || ''}
                    onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                    className="input-field"
                    placeholder="https://instagram.com/yourstore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                    className="input-field"
                    placeholder="https://linkedin.com/company/yourstore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={formData.youtubeUrl || ''}
                    onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                    className="input-field"
                    placeholder="https://youtube.com/c/yourstore"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Quick Links</h3>
            <p className="text-sm text-gray-600">
              Configure additional links that will appear in your storefront footer.
            </p>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Track Order URL
                </label>
                <input
                  type="url"
                  value={formData.trackOrderUrl || ''}
                  onChange={(e) => handleInputChange('trackOrderUrl', e.target.value)}
                  className="input-field"
                  placeholder="https://yourstore.com/track-order"
                />
                <p className="mt-1 text-sm text-gray-500">
                  URL where customers can track their orders
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
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
