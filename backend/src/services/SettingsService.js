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
    
    // Color fields
    if (backgroundColor !== undefined) updatePayload.backgroundColor = backgroundColor;
    if (sidebarBackgroundColor !== undefined) updatePayload.sidebarBackgroundColor = sidebarBackgroundColor;
    if (sidebarSelectedColor !== undefined) updatePayload.sidebarSelectedColor = sidebarSelectedColor;
    if (sidebarHoverColor !== undefined) updatePayload.sidebarHoverColor = sidebarHoverColor;
    if (cardInfoBackgroundColor !== undefined) updatePayload.cardInfoBackgroundColor = cardInfoBackgroundColor;
    if (headerBackgroundColor !== undefined) updatePayload.headerBackgroundColor = headerBackgroundColor;
    if (headerTextColor !== undefined) updatePayload.headerTextColor = headerTextColor;
    if (headerBorderColor !== undefined) updatePayload.headerBorderColor = headerBorderColor;
    if (searchBarBackgroundColor !== undefined) updatePayload.searchBarBackgroundColor = searchBarBackgroundColor;
    if (searchBarBorderColor !== undefined) updatePayload.searchBarBorderColor = searchBarBorderColor;
    if (searchBarTextColor !== undefined) updatePayload.searchBarTextColor = searchBarTextColor;
    if (searchBarPlaceholderColor !== undefined) updatePayload.searchBarPlaceholderColor = searchBarPlaceholderColor;
    if (searchBarIconColor !== undefined) updatePayload.searchBarIconColor = searchBarIconColor;
    if (sidebarTextColor !== undefined) updatePayload.sidebarTextColor = sidebarTextColor;
    if (sidebarSelectedTextColor !== undefined) updatePayload.sidebarSelectedTextColor = sidebarSelectedTextColor;
    if (sidebarHeadingColor !== undefined) updatePayload.sidebarHeadingColor = sidebarHeadingColor;
    if (sidebarDividerColor !== undefined) updatePayload.sidebarDividerColor = sidebarDividerColor;
    if (sidebarBorderColor !== undefined) updatePayload.sidebarBorderColor = sidebarBorderColor;
    if (productCardBorderColor !== undefined) updatePayload.productCardBorderColor = productCardBorderColor;
    if (productCardHoverBorderColor !== undefined) updatePayload.productCardHoverBorderColor = productCardHoverBorderColor;
    if (productCardTextColor !== undefined) updatePayload.productCardTextColor = productCardTextColor;
    if (productCardCategoryTextColor !== undefined) updatePayload.productCardCategoryTextColor = productCardCategoryTextColor;
    if (productCardPriceTextColor !== undefined) updatePayload.productCardPriceTextColor = productCardPriceTextColor;
    if (buttonPrimaryBackgroundColor !== undefined) updatePayload.buttonPrimaryBackgroundColor = buttonPrimaryBackgroundColor;
    if (buttonPrimaryTextColor !== undefined) updatePayload.buttonPrimaryTextColor = buttonPrimaryTextColor;
    if (buttonSecondaryBackgroundColor !== undefined) updatePayload.buttonSecondaryBackgroundColor = buttonSecondaryBackgroundColor;
    if (buttonSecondaryTextColor !== undefined) updatePayload.buttonSecondaryTextColor = buttonSecondaryTextColor;
    if (buttonSecondaryBorderColor !== undefined) updatePayload.buttonSecondaryBorderColor = buttonSecondaryBorderColor;
    if (linkColor !== undefined) updatePayload.linkColor = linkColor;
    if (linkHoverColor !== undefined) updatePayload.linkHoverColor = linkHoverColor;
    if (footerBackgroundColor !== undefined) updatePayload.footerBackgroundColor = footerBackgroundColor;
    if (footerTextColor !== undefined) updatePayload.footerTextColor = footerTextColor;
    if (footerHeadingColor !== undefined) updatePayload.footerHeadingColor = footerHeadingColor;
    if (footerLinkColor !== undefined) updatePayload.footerLinkColor = footerLinkColor;
    if (categorySectionTitleColor !== undefined) updatePayload.categorySectionTitleColor = categorySectionTitleColor;
    if (categorySectionAccentColor !== undefined) updatePayload.categorySectionAccentColor = categorySectionAccentColor;
    if (categorySectionLinkColor !== undefined) updatePayload.categorySectionLinkColor = categorySectionLinkColor;
    if (categorySectionLinkHoverColor !== undefined) updatePayload.categorySectionLinkHoverColor = categorySectionLinkHoverColor;
    if (categorySectionBorderColor !== undefined) updatePayload.categorySectionBorderColor = categorySectionBorderColor;
    if (breadcrumbTextColor !== undefined) updatePayload.breadcrumbTextColor = breadcrumbTextColor;
    if (breadcrumbActiveTextColor !== undefined) updatePayload.breadcrumbActiveTextColor = breadcrumbActiveTextColor;
    if (breadcrumbHoverColor !== undefined) updatePayload.breadcrumbHoverColor = breadcrumbHoverColor;
    if (breadcrumbIconColor !== undefined) updatePayload.breadcrumbIconColor = breadcrumbIconColor;
    if (productDetailCardBackgroundColor !== undefined) updatePayload.productDetailCardBackgroundColor = productDetailCardBackgroundColor;

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
