const Joi = require('joi');

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    tenantName: Joi.string().min(2).max(100).required(),
    subdomain: Joi.string().alphanum().min(3).max(50).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  category: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    slug: Joi.string().pattern(slugRegex).required(),
    description: Joi.string().max(500).optional(),
    parentId: Joi.string().uuid().optional().allow(null),
    isActive: Joi.boolean().optional()
  }),

  product: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(2000).optional(),
    slug: Joi.string().pattern(slugRegex).required(),
    price: Joi.number().positive().precision(2).required(),
    stockQuantity: Joi.number().integer().min(0).required(),
    status: Joi.string().valid('ACTIVE', 'DRAFT').required(),
    categoryId: Joi.string().uuid().optional().allow(null),
    // Custom attributes as JSON (e.g., {"material": "Cotton", "brand": "Nike"})
    attributes: Joi.object().optional(),
    // Variants array for creating product with variants
    variants: Joi.array().items(Joi.object({
      sku: Joi.string().max(100).optional(),
      options: Joi.object().required(), // e.g., {"size": "M", "color": "Red"}
      price: Joi.number().positive().precision(2).optional().allow(null),
      stockQuantity: Joi.number().integer().min(0).optional(),
      isActive: Joi.boolean().optional()
    })).optional()
  }),

  productUpdate: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(2000).optional(),
    slug: Joi.string().pattern(slugRegex).optional(),
    price: Joi.number().positive().precision(2).optional(),
    stockQuantity: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('ACTIVE', 'DRAFT').optional(),
    categoryId: Joi.string().uuid().optional().allow(null),
    attributes: Joi.object().optional().allow(null)
  }),

  variant: Joi.object({
    sku: Joi.string().max(100).optional(),
    options: Joi.object().required(), // e.g., {"size": "M", "color": "Red"}
    price: Joi.number().positive().precision(2).optional().allow(null),
    stockQuantity: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional()
  }),

  variantUpdate: Joi.object({
    sku: Joi.string().max(100).optional(),
    options: Joi.object().optional(),
    price: Joi.number().positive().precision(2).optional().allow(null),
    stockQuantity: Joi.number().integer().min(0).optional(),
    isActive: Joi.boolean().optional()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().max(100).optional()
  }),

  // More flexible pagination for admin and dashboard queries
  paginationLarge: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().max(100).optional(),
    categoryId: Joi.string().uuid().optional(),
    status: Joi.string().valid('ACTIVE', 'DRAFT', 'DELETED').optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation error',
        details: errorDetails
      });
    }

    req.validatedData = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Query validation error',
        details: errorDetails
      });
    }

    req.validatedQuery = value;
    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateQuery
};