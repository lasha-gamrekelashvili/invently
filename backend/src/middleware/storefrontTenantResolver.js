import tenantResolver from './tenantResolver.js';

/** Storefront routes: require active tenant + valid subscription. */
const storefrontTenantResolver = (req, res, next) => {
  req.requireActiveTenant = true;
  return tenantResolver(req, res, next);
};

export default storefrontTenantResolver;
