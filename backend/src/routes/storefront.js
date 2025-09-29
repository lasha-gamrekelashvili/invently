const express = require('express');
const {
  getStoreInfo,
  getPublicCategories,
  getPublicProducts,
  getPublicProductBySlug,
  getProductsByCategory
} = require('../controllers/storefrontController');
const { getPublicSettings } = require('../controllers/settingsController');
const tenantResolver = require('../middleware/tenantResolver');

const router = express.Router();

// Apply tenant resolver to all storefront routes
router.use(tenantResolver);

/**
 * @swagger
 * /storefront/info:
 *   get:
 *     summary: Get store information
 *     description: Retrieves basic information about the current store (public endpoint)
 *     tags: [Storefront]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *     responses:
 *       200:
 *         description: Store information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: Store ID
 *                   example: f47ac10b-58cc-4372-a567-0e02b2c3d480
 *                 name:
 *                   type: string
 *                   description: Store name
 *                   example: John's Electronics Store
 *                 subdomain:
 *                   type: string
 *                   description: Store subdomain
 *                   example: johnstore
 *                 description:
 *                   type: string
 *                   description: Store description
 *                   example: Premium electronics and gadgets
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Store not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /storefront/categories:
 *   get:
 *     summary: Get public categories
 *     description: Retrieves all active categories for the current store (public endpoint)
 *     tags: [Storefront]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Category'
 *                   - type: object
 *                     properties:
 *                       children:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Category'
 *                         description: Child categories
 *                       _count:
 *                         type: object
 *                         properties:
 *                           products:
 *                             type: integer
 *                             description: Number of active products in this category
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Store not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /storefront/products:
 *   get:
 *     summary: Get public products
 *     description: Retrieves all active products for the current store with pagination and filtering (public endpoint)
 *     tags: [Storefront]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - name: categoryId
 *         in: query
 *         description: Filter by category ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d481
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Product'
 *                       - type: object
 *                         properties:
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               slug:
 *                                 type: string
 *                             nullable: true
 *                           images:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/ProductImage'
 *                             description: First product image (sorted by sortOrder)
 *                             maxItems: 1
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Store not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /storefront/products/{slug}:
 *   get:
 *     summary: Get product by slug
 *     description: Retrieves a specific active product by its slug (public endpoint)
 *     tags: [Storefront]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: slug
 *         in: path
 *         required: true
 *         description: Product slug
 *         schema:
 *           type: string
 *           example: iphone-15-pro-max
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Product'
 *                 - type: object
 *                   properties:
 *                     category:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         slug:
 *                           type: string
 *                       nullable: true
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductImage'
 *                       description: All product images sorted by sortOrder
 *       404:
 *         description: Store or product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               store_not_found:
 *                 summary: Store not found
 *                 value:
 *                   error: Store not found
 *               product_not_found:
 *                 summary: Product not found
 *                 value:
 *                   error: Product not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /storefront/categories/{categorySlug}/products:
 *   get:
 *     summary: Get products by category
 *     description: Retrieves all active products in a specific category (public endpoint)
 *     tags: [Storefront]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: categorySlug
 *         in: path
 *         required: true
 *         description: Category slug
 *         schema:
 *           type: string
 *           example: smartphones
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *                 products:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Product'
 *                       - type: object
 *                         properties:
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               slug:
 *                                 type: string
 *                             nullable: true
 *                           images:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/ProductImage'
 *                             description: First product image (sorted by sortOrder)
 *                             maxItems: 1
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       404:
 *         description: Store or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               store_not_found:
 *                 summary: Store not found
 *                 value:
 *                   error: Store not found
 *               category_not_found:
 *                 summary: Category not found
 *                 value:
 *                   error: Category not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.use(tenantResolver);

router.get('/info', getStoreInfo);
router.get('/categories', getPublicCategories);
router.get('/products', getPublicProducts);
router.get('/products/:slug', getPublicProductBySlug);
router.get('/categories/:categorySlug/products', getProductsByCategory);
router.get('/settings', getPublicSettings);

module.exports = router;