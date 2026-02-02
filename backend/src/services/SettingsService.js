import { SettingsRepository } from '../repositories/SettingsRepository.js';

export class SettingsService {
  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  /**
   * Gets settings for a tenant, creating default ones if they don't exist
   */
  async getSettings(tenantId) {
    let settings = await this.settingsRepository.findByTenantId(tenantId);

    if (!settings) {
      settings = await this.settingsRepository.createDefaultSettings(tenantId);
    }

    return settings;
  }

  /**
   * Updates settings for a tenant
   */
  async updateSettings(tenantId, updateData) {
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
    } = updateData;

    // Build update object with only provided fields
    const updatePayload = {};
    if (aboutUs !== undefined) updatePayload.aboutUs = aboutUs;
    if (contact !== undefined) updatePayload.contact = contact;
    if (privacyPolicy !== undefined) updatePayload.privacyPolicy = privacyPolicy;
    if (termsOfService !== undefined) updatePayload.termsOfService = termsOfService;
    if (shippingInfo !== undefined) updatePayload.shippingInfo = shippingInfo;
    if (returns !== undefined) updatePayload.returns = returns;
    if (faq !== undefined) updatePayload.faq = faq;
    if (facebookUrl !== undefined) updatePayload.facebookUrl = facebookUrl;
    if (twitterUrl !== undefined) updatePayload.twitterUrl = twitterUrl;
    if (instagramUrl !== undefined) updatePayload.instagramUrl = instagramUrl;
    if (linkedinUrl !== undefined) updatePayload.linkedinUrl = linkedinUrl;
    if (youtubeUrl !== undefined) updatePayload.youtubeUrl = youtubeUrl;
      if (trackOrderUrl !== undefined) updatePayload.trackOrderUrl = trackOrderUrl;

    const settings = await this.settingsRepository.upsertSettings(tenantId, updatePayload);

    return settings;
  }

  /**
   * Gets public settings for a tenant
   */
  async getPublicSettings(tenantId) {
    if (!tenantId) {
      throw new Error('Store not found');
    }

    const settings = await this.settingsRepository.findByTenantId(tenantId);

    return settings || null;
  }
}
