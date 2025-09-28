const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { authenticateToken, requireStoreOwner } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');
const { validate, validateQuery, schemas } = require('../utils/validation');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Creates a new product for the current tenant's store
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *               - price
 *               - stockQuantity
 *               - status
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Product title
 *                 example: iPhone 15 Pro Max
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Product description
 *                 example: The ultimate iPhone with the largest display and longest battery life
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 description: URL-friendly product identifier
 *                 example: iphone-15-pro-max
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Product price
 *                 example: 1199.99
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity
 *                 example: 25
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DRAFT]
 *                 description: Product status
 *                 example: ACTIVE
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Category ID
 *                 example: f47ac10b-58cc-4372-a567-0e02b2c3d481
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Product'
 *                 - type: object
 *                   properties:
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *                       nullable: true
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductImage'
 *       400:
 *         description: Validation error or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   error: Validation error
 *                   details:
 *                     - field: title
 *                       message: Title is required
 *               slug_exists:
 *                 summary: Slug already exists
 *                 value:
 *                   error: Product slug already exists in this store
 *               category_not_found:
 *                 summary: Category not found
 *                 value:
 *                   error: Category not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Retrieves all products for the current tenant with pagination and filtering
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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
 *       - name: status
 *         in: query
 *         description: Filter by product status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, DRAFT, DELETED]
 *           example: ACTIVE
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
 *                             $ref: '#/components/schemas/Category'
 *                             nullable: true
 *                           images:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/ProductImage'
 *                             description: Product images sorted by sortOrder
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /products/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     description: Retrieves a specific product by its slug
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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
 *                       $ref: '#/components/schemas/Category'
 *                       nullable: true
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductImage'
 *                       description: Product images sorted by sortOrder
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Product not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieves a specific product by its ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: id
 *         in: path
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d482
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
 *                       $ref: '#/components/schemas/Category'
 *                       nullable: true
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductImage'
 *                       description: Product images sorted by sortOrder
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Product not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     description: Updates an existing product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: id
 *         in: path
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d482
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Product title
 *                 example: iPhone 15 Pro Max
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Product description
 *                 example: The ultimate iPhone with the largest display and longest battery life
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 description: URL-friendly product identifier
 *                 example: iphone-15-pro-max
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Product price
 *                 example: 1199.99
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity
 *                 example: 25
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DRAFT]
 *                 description: Product status
 *                 example: ACTIVE
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Category ID
 *                 example: f47ac10b-58cc-4372-a567-0e02b2c3d481
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Product'
 *                 - type: object
 *                   properties:
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *                       nullable: true
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductImage'
 *       400:
 *         description: Validation error or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   error: Validation error
 *                   details:
 *                     - field: title
 *                       message: Title is required
 *               slug_exists:
 *                 summary: Slug already exists
 *                 value:
 *                   error: Product slug already exists in this store
 *               category_not_found:
 *                 summary: Category not found
 *                 value:
 *                   error: Category not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Product not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product
 *     description: Soft deletes a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: id
 *         in: path
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d482
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Product deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Product not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.use(tenantResolver);
router.use(authenticateToken);
router.use(requireStoreOwner);

router.post(
  '/',
  validate(schemas.product),
  auditMiddleware('CREATE', 'PRODUCT'),
  createProduct
);

router.get(
  '/',
  validateQuery(schemas.paginationLarge),
  getProducts
);

router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

router.put(
  '/:id',
  validate(schemas.productUpdate),
  auditMiddleware('UPDATE', 'PRODUCT'),
  updateProduct
);

router.delete(
  '/:id',
  auditMiddleware('DELETE', 'PRODUCT'),
  deleteProduct
);

module.exports = router;