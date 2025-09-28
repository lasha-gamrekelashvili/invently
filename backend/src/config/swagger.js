const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Invently Multi-Tenant Shop API',
      version: '1.0.0',
      description: 'A comprehensive SaaS platform API that enables sellers to instantly create and manage their online shops with multi-tenant architecture. Features include multi-tenant architecture, role-based access control, complete product management, public storefront API, audit logging, and file upload support.',
      contact: {
        name: 'API Support',
        email: 'support@invently.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server'
      },
      {
        url: 'https://api.invently.com/api',
        description: 'Production server'
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
            price: { type: 'number' },
            stockQuantity: { type: 'integer' },
            status: { type: 'string', enum: ['ACTIVE', 'DRAFT', 'DELETED'] },
            createdAt: { type: 'string', format: 'date-time' }
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

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-outline.css'
  })
};