const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getSettings = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    let settings = await prisma.storeSettings.findUnique({
      where: { tenantId }
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: { tenantId }
      });
    }

    res.json({ data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      trackOrderUrl
    } = req.body;

    // Upsert settings
    const settings = await prisma.storeSettings.upsert({
      where: { tenantId },
      update: {
        ...(aboutUs !== undefined && { aboutUs }),
        ...(contact !== undefined && { contact }),
        ...(privacyPolicy !== undefined && { privacyPolicy }),
        ...(termsOfService !== undefined && { termsOfService }),
        ...(shippingInfo !== undefined && { shippingInfo }),
        ...(returns !== undefined && { returns }),
        ...(faq !== undefined && { faq }),
        ...(facebookUrl !== undefined && { facebookUrl }),
        ...(twitterUrl !== undefined && { twitterUrl }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(youtubeUrl !== undefined && { youtubeUrl }),
        ...(trackOrderUrl !== undefined && { trackOrderUrl }),
      },
      create: {
        tenantId,
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
      }
    });

    res.json({ data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Public endpoint for storefront
const getPublicSettings = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const settings = await prisma.storeSettings.findUnique({
      where: { tenantId: req.tenant.id }
    });

    // Return null if no settings exist
    res.json(settings || null);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getPublicSettings
};