import swaggerJsdoc from 'swagger-jsdoc';
import { serve as _serve, setup as _setup } from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shopu Multi-Tenant E-Commerce API',
      version: '1.0.0',
      description: 'Multi-tenant e-commerce platform API with customizable product variants and attributes',
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
      {
        url: 'https://momigvare.onrender.com/api',
        description: 'Production server',
      },
    ],
    
    tags: [
      {
        name: 'Public',
        description: 'Public endpoints (no authentication required)'
      },
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Product Variants',
        description: 'Product variant management (sizes, colors, etc.)'
      },
      {
        name: 'Categories',
        description: 'Category management endpoints'
      },
      {
        name: 'Cart',
        description: 'Shopping cart endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token received from login endpoint'
        }
      },
      parameters: {
        TenantHost: {
          name: 'Host',
          in: 'header',
          required: true,
          description: 'Tenant subdomain (e.g., mystore.example.com)',
          schema: {
            type: 'string',
            example: 'mystore.example.com'
          }
        },
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 20
          }
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search term',
          schema: {
            type: 'string',
            maxLength: 100
          }
        },
        SortByParam: {
          name: 'sortBy',
          in: 'query',
          description: 'Field to sort by',
          schema: {
            type: 'string',
            default: 'createdAt'
          }
        },
        SortOrderParam: {
          name: 'sortOrder',
          in: 'query',
          description: 'Sort order',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          }
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: { 
              type: 'string', 
              format: 'email',
              description: 'User email address'
            },
            firstName: { 
              type: 'string',
              description: 'User first name'
            },
            lastName: { 
              type: 'string',
              description: 'User last name'
            },
            role: { 
              type: 'string', 
              enum: ['PLATFORM_ADMIN', 'STORE_OWNER'],
              description: 'User role'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'User creation timestamp'
            }
          },
          example: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'STORE_OWNER',
            createdAt: '2023-09-27T10:30:00Z'
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            subdomain: { type: 'string' },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            parentId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            slug: { type: 'string' },
            price: { type: 'number', description: 'Base price (can be overridden by variants)' },
            stockQuantity: { type: 'integer', description: 'Base stock (can be overridden by variants)' },
            isActive: { type: 'boolean', description: 'true = visible in storefront, false = draft/hidden' },
            isDeleted: { type: 'boolean', description: 'Soft deletion flag' },
            attributes: {
              type: 'object',
              description: 'Custom product attributes (e.g., {"material": "Cotton", "brand": "Nike"})',
              nullable: true,
              additionalProperties: true
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ProductVariant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Variant identifier'
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'Parent product ID'
            },
            sku: {
              type: 'string',
              description: 'Stock Keeping Unit (unique identifier)',
              nullable: true
            },
            options: {
              type: 'object',
              description: 'Variant options (e.g., {"size": "M", "color": "Red"})',
              additionalProperties: true
            },
            price: {
              type: 'number',
              description: 'Variant price (overrides product base price if set)',
              nullable: true
            },
            stockQuantity: {
              type: 'integer',
              description: 'Available stock for this variant'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether variant is active and available for purchase'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Variant creation timestamp'
            }
          },
          example: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d484',
            productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
            sku: 'TSHIRT-RED-M',
            options: {
              size: 'Medium',
              color: 'Red'
            },
            price: 29.99,
            stockQuantity: 50,
            isActive: true,
            createdAt: '2023-09-27T10:30:00Z'
          }
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              description: 'Image identifier'
            },
            url: { 
              type: 'string', 
              format: 'uri',
              description: 'Image URL'
            },
            altText: { 
              type: 'string',
              description: 'Alt text for accessibility',
              nullable: true
            },
            sortOrder: { 
              type: 'integer',
              description: 'Display order of the image'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Image upload timestamp'
            }
          },
          example: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d483',
            url: 'https://example.com/uploads/product-image.jpg',
            altText: 'iPhone 15 Pro front view',
            sortOrder: 1,
            createdAt: '2023-09-27T10:30:00Z'
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { 
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { 
                    type: 'string',
                    description: 'Field that caused the error'
                  },
                  message: { 
                    type: 'string',
                    description: 'Detailed error message'
                  }
                }
              },
              description: 'Detailed validation errors'
            }
          },
          example: {
            error: 'Validation error',
            details: [
              {
                field: 'email',
                message: 'Email is required'
              }
            ]
          }
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            }
          },
          example: {
            message: 'Operation completed successfully'
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            pages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          },
          example: {
            page: 1,
            limit: 20,
            total: 45,
            pages: 3
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Access token required'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Access denied'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Internal server error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

export const serve = _serve;
export const setup = _setup(specs);