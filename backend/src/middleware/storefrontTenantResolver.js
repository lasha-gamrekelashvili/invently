import tenantResolver from './tenantResolver.js';

/**
 * Middleware for storefront routes that requires active tenant with subscription.
 * Sets a flag to require active tenant in tenantResolver.
 */
const storefrontTenantResolver = async (req, res, next) => {
  // Set flag to require active tenant + subscription
  req.requireActiveTenant = true;
  return tenantResolver(req, res, next);
};

export default storefrontTenantResolver;
