import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../utils/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { useLanguage } from '../contexts/LanguageContext';
import { UpdateStoreSettingsData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import StorefrontPreview, { StorefrontProductPreview } from '../components/StorefrontPreview';
import { PaintBrushIcon } from '@heroicons/react/24/outline';

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

const Appearance = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateStoreSettingsData>({});
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

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: settingsAPI.updateSettings,
    onSuccess: (data) => {
      handleSuccess(data.message);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      handleApiError(error, t('settings.messages.updateAppearanceError'));
    },
  });

  const handleResetAppearance = () => {
    // Reset to defaults: keep non-appearance fields, replace appearance fields with defaults
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
    updateSettingsMutation.mutate(formData);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.appearance.title')}
        subtitle={t('settings.appearance.description')}
        icon={PaintBrushIcon}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Two Column Layout: Preview on right, Colors on left */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Color Settings - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 appearance-color-settings">
          
            {/* Layout & Background Section */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.appearance.sections.layoutBackground')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* Header & Navigation Section */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.appearance.sections.headerNavigation')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.headerBackground.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.headerBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, headerBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.headerBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, headerBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.headerBackground.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.headerText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.headerTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, headerTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.headerTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, headerTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.headerText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.headerBorder.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.headerBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, headerBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.headerBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, headerBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.headerBorder.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.searchBarBackground.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.searchBarBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, searchBarBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.searchBarBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, searchBarBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.searchBarBackground.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.searchBarBorder.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.searchBarBorderColor || '#d4d4d4'} onChange={(e) => setFormData({ ...formData, searchBarBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.searchBarBorderColor || '#d4d4d4'} onChange={(e) => setFormData({ ...formData, searchBarBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#d4d4d4" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.searchBarBorder.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.searchBarText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.searchBarTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, searchBarTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.searchBarTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, searchBarTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.searchBarText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.searchBarPlaceholder.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.searchBarPlaceholderColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, searchBarPlaceholderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.searchBarPlaceholderColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, searchBarPlaceholderColor: e.target.value })} className="flex-1 input-field" placeholder="#a3a3a3" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.searchBarPlaceholder.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.searchBarIcon.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.searchBarIconColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, searchBarIconColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.searchBarIconColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, searchBarIconColor: e.target.value })} className="flex-1 input-field" placeholder="#a3a3a3" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.searchBarIcon.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.breadcrumbText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.breadcrumbTextColor || '#525252'} onChange={(e) => setFormData({ ...formData, breadcrumbTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.breadcrumbTextColor || '#525252'} onChange={(e) => setFormData({ ...formData, breadcrumbTextColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.breadcrumbText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.breadcrumbActive.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.breadcrumbActiveTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, breadcrumbActiveTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.breadcrumbActiveTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, breadcrumbActiveTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.breadcrumbActive.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.breadcrumbHover.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.breadcrumbHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, breadcrumbHoverColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.breadcrumbHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, breadcrumbHoverColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.breadcrumbHover.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.breadcrumbIcon.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.breadcrumbIconColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, breadcrumbIconColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.breadcrumbIconColor || '#a3a3a3'} onChange={(e) => setFormData({ ...formData, breadcrumbIconColor: e.target.value })} className="flex-1 input-field" placeholder="#a3a3a3" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.breadcrumbIcon.description')}</p>
                </div>
              </div>
            </div>

            {/* Sidebar Section */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.appearance.sections.sidebar')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.sidebarText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.sidebarTextColor || '#525252'} onChange={(e) => setFormData({ ...formData, sidebarTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.sidebarTextColor || '#525252'} onChange={(e) => setFormData({ ...formData, sidebarTextColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.sidebarText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.sidebarSelectedText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.sidebarSelectedTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, sidebarSelectedTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.sidebarSelectedTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, sidebarSelectedTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.sidebarSelectedText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.sidebarHeading.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.sidebarHeadingColor || '#737373'} onChange={(e) => setFormData({ ...formData, sidebarHeadingColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.sidebarHeadingColor || '#737373'} onChange={(e) => setFormData({ ...formData, sidebarHeadingColor: e.target.value })} className="flex-1 input-field" placeholder="#737373" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.sidebarHeading.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.sidebarDivider.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.sidebarDividerColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, sidebarDividerColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.sidebarDividerColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, sidebarDividerColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.sidebarDivider.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.sidebarBorder.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.sidebarBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, sidebarBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.sidebarBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, sidebarBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.sidebarBorder.description')}</p>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.appearance.sections.products')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.productCardBorder.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.productCardBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, productCardBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.productCardBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, productCardBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.productCardBorder.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.productCardHoverBorder.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.productCardHoverBorderColor || '#d4d4d4'} onChange={(e) => setFormData({ ...formData, productCardHoverBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.productCardHoverBorderColor || '#d4d4d4'} onChange={(e) => setFormData({ ...formData, productCardHoverBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#d4d4d4" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.productCardHoverBorder.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.productCardText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.productCardTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, productCardTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.productCardTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, productCardTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.productCardText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.productCardCategoryText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.productCardCategoryTextColor || '#737373'} onChange={(e) => setFormData({ ...formData, productCardCategoryTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.productCardCategoryTextColor || '#737373'} onChange={(e) => setFormData({ ...formData, productCardCategoryTextColor: e.target.value })} className="flex-1 input-field" placeholder="#737373" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.productCardCategoryText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.productCardPriceText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.productCardPriceTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, productCardPriceTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.productCardPriceTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, productCardPriceTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.productCardPriceText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.productDetailCardBackground.label')}</label>
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
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.productDetailCardBackground.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.categorySectionTitle.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.categorySectionTitleColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionTitleColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.categorySectionTitleColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionTitleColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.categorySectionTitle.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.categorySectionAccent.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.categorySectionAccentColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionAccentColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.categorySectionAccentColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionAccentColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.categorySectionAccent.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.categorySectionLink.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.categorySectionLinkColor || '#525252'} onChange={(e) => setFormData({ ...formData, categorySectionLinkColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.categorySectionLinkColor || '#525252'} onChange={(e) => setFormData({ ...formData, categorySectionLinkColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.categorySectionLink.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.categorySectionLinkHover.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.categorySectionLinkHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionLinkHoverColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.categorySectionLinkHoverColor || '#171717'} onChange={(e) => setFormData({ ...formData, categorySectionLinkHoverColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.categorySectionLinkHover.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.categorySectionBorder.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.categorySectionBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, categorySectionBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.categorySectionBorderColor || '#e5e5e5'} onChange={(e) => setFormData({ ...formData, categorySectionBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#e5e5e5" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.categorySectionBorder.description')}</p>
                </div>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.appearance.sections.buttons')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.buttonPrimaryBackground.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.buttonPrimaryBackgroundColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonPrimaryBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.buttonPrimaryBackgroundColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonPrimaryBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.buttonPrimaryBackground.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.buttonPrimaryText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.buttonPrimaryTextColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, buttonPrimaryTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.buttonPrimaryTextColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, buttonPrimaryTextColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.buttonPrimaryText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.buttonSecondaryBackground.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.buttonSecondaryBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, buttonSecondaryBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.buttonSecondaryBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, buttonSecondaryBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.buttonSecondaryBackground.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.buttonSecondaryText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.buttonSecondaryTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonSecondaryTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.buttonSecondaryTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonSecondaryTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.buttonSecondaryText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.buttonSecondaryBorder.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.buttonSecondaryBorderColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonSecondaryBorderColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.buttonSecondaryBorderColor || '#171717'} onChange={(e) => setFormData({ ...formData, buttonSecondaryBorderColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.buttonSecondaryBorder.description')}</p>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.appearance.sections.footer')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.footerBackground.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.footerBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, footerBackgroundColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.footerBackgroundColor || '#ffffff'} onChange={(e) => setFormData({ ...formData, footerBackgroundColor: e.target.value })} className="flex-1 input-field" placeholder="#ffffff" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.footerBackground.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.footerText.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.footerTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.footerTextColor || '#171717'} onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.footerText.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.footerHeading.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.footerHeadingColor || '#171717'} onChange={(e) => setFormData({ ...formData, footerHeadingColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.footerHeadingColor || '#171717'} onChange={(e) => setFormData({ ...formData, footerHeadingColor: e.target.value })} className="flex-1 input-field" placeholder="#171717" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.footerHeading.description')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.appearance.footerLink.label')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.footerLinkColor || '#525252'} onChange={(e) => setFormData({ ...formData, footerLinkColor: e.target.value })} className="w-16 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={formData.footerLinkColor || '#525252'} onChange={(e) => setFormData({ ...formData, footerLinkColor: e.target.value })} className="flex-1 input-field" placeholder="#525252" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.appearance.footerLink.description')}</p>
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
                      {t('settings.appearance.preview.storefront')}
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
                      {t('settings.appearance.preview.productDetail')}
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
                  disabled={updateSettingsMutation.isPending}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateSettingsMutation.isPending 
                    ? t('settings.actions.saving') 
                    : t('settings.actions.saveSettings')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Appearance;
