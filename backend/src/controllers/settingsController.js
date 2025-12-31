import { SettingsService } from '../services/SettingsService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const settingsService = new SettingsService();

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

export {
  getSettings,
  updateSettings,
  getPublicSettings
};