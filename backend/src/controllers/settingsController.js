import { SettingsService } from '../services/SettingsService.js';
import { TenantService } from '../services/TenantService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const settingsService = new SettingsService();
const tenantService = new TenantService();

const getSettings = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const settings = await settingsService.getSettings(tenantId);

    res.json(ApiResponse.success(settings));
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const updateSettings = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      aboutUs,
      contact,
      privacyPolicy,
      termsOfService,
      shippingInfo,
      returns,
      faq,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
      youtubeUrl,
      trackOrderUrl,
      backgroundColor,
      sidebarBackgroundColor,
      sidebarSelectedColor,
      sidebarHoverColor,
      cardInfoBackgroundColor,
      headerBackgroundColor,
      headerTextColor,
      headerBorderColor,
      searchBarBackgroundColor,
      searchBarBorderColor,
      searchBarTextColor,
      searchBarPlaceholderColor,
      searchBarIconColor,
      sidebarTextColor,
      sidebarSelectedTextColor,
      sidebarHeadingColor,
      sidebarDividerColor,
      sidebarBorderColor,
      productCardBorderColor,
      productCardHoverBorderColor,
      productCardTextColor,
      productCardCategoryTextColor,
      productCardPriceTextColor,
      buttonPrimaryBackgroundColor,
      buttonPrimaryTextColor,
      buttonSecondaryBackgroundColor,
      buttonSecondaryTextColor,
      buttonSecondaryBorderColor,
      linkColor,
      linkHoverColor,
      footerBackgroundColor,
      footerTextColor,
      footerHeadingColor,
      footerLinkColor,
      categorySectionTitleColor,
      categorySectionAccentColor,
      categorySectionLinkColor,
      categorySectionLinkHoverColor,
      categorySectionBorderColor,
      breadcrumbTextColor,
      breadcrumbActiveTextColor,
      breadcrumbHoverColor,
      breadcrumbIconColor,
      productDetailCardBackgroundColor,
    } = req.body;

    const settings = await settingsService.updateSettings(tenantId, {
      aboutUs,
      contact,
      privacyPolicy,
      termsOfService,
      shippingInfo,
      returns,
      faq,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
      youtubeUrl,
      trackOrderUrl,
      backgroundColor,
      sidebarBackgroundColor,
      sidebarSelectedColor,
      sidebarHoverColor,
      cardInfoBackgroundColor,
      headerBackgroundColor,
      headerTextColor,
      headerBorderColor,
      searchBarBackgroundColor,
      searchBarBorderColor,
      searchBarTextColor,
      searchBarPlaceholderColor,
      searchBarIconColor,
      sidebarTextColor,
      sidebarSelectedTextColor,
      sidebarHeadingColor,
      sidebarDividerColor,
      sidebarBorderColor,
      productCardBorderColor,
      productCardHoverBorderColor,
      productCardTextColor,
      productCardCategoryTextColor,
      productCardPriceTextColor,
      buttonPrimaryBackgroundColor,
      buttonPrimaryTextColor,
      buttonSecondaryBackgroundColor,
      buttonSecondaryTextColor,
      buttonSecondaryBorderColor,
      linkColor,
      linkHoverColor,
      footerBackgroundColor,
      footerTextColor,
      footerHeadingColor,
      footerLinkColor,
      categorySectionTitleColor,
      categorySectionAccentColor,
      categorySectionLinkColor,
      categorySectionLinkHoverColor,
      categorySectionBorderColor,
      breadcrumbTextColor,
      breadcrumbActiveTextColor,
      breadcrumbHoverColor,
      breadcrumbIconColor,
      productDetailCardBackgroundColor,
    });

    res.json(ApiResponse.updated(settings, 'Settings updated successfully'));
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

// Public endpoint for storefront
const getPublicSettings = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    const settings = await settingsService.getPublicSettings(tenantId);

    res.json(settings || null);
  } catch (error) {
    if (error.message === 'Store not found') {
      return res.status(404).json(ApiResponse.error(error.message));
    }
    console.error('Get public settings error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const updateTenantSubdomain = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    const { subdomain } = req.validatedData;

    const result = await tenantService.updateSubdomain(tenantId, subdomain, userId);

    res.json(
      ApiResponse.updated(
        { tenant: result.tenant },
        'Subdomain updated successfully. Please note: You will need to access your store using the new subdomain URL.'
      )
    );
  } catch (error) {
    if (error.message === 'Tenant not found') {
      return res.status(404).json(ApiResponse.notFound('Tenant'));
    }
    if (error.message === 'Unauthorized: You do not own this tenant') {
      return res.status(403).json(ApiResponse.forbidden(error.message));
    }
    if (error.message === 'Subdomain already taken') {
      return res.status(400).json(ApiResponse.error('Subdomain already taken'));
    }
    console.error('Update tenant subdomain error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const updateTenantCustomDomain = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user.id;
    const { customDomain } = req.validatedData;

    const result = await tenantService.updateCustomDomain(tenantId, customDomain, userId);

    const message = customDomain
      ? `Custom domain updated successfully. Please configure your DNS: Add a CNAME record pointing 'www' to 'shopu.ge'. Your store will be available at https://${customDomain} once DNS propagates (5-60 minutes).`
      : 'Custom domain removed successfully. Your store will continue to work at your subdomain URL.';

    res.json(
      ApiResponse.updated(
        { tenant: result.tenant },
        message
      )
    );
  } catch (error) {
    if (error.message === 'Tenant not found') {
      return res.status(404).json(ApiResponse.notFound('Tenant'));
    }
    if (error.message === 'Unauthorized: You do not own this tenant') {
      return res.status(403).json(ApiResponse.forbidden(error.message));
    }
    if (error.message === 'Custom domain already taken') {
      return res.status(400).json(ApiResponse.error('Custom domain already taken'));
    }
    console.error('Update tenant custom domain error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export {
  getSettings,
  updateSettings,
  getPublicSettings,
  updateTenantSubdomain,
  updateTenantCustomDomain
};