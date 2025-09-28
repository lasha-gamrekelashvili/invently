const express = require('express');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticateToken, requireStoreOwner } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');
const { validate, validateQuery, schemas } = require('../utils/validation');
const { auditMiddleware } = require('../utils/auditLogger');

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     description: Creates a new category for the current tenant's store
 *     tags: [Categories]
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
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Category name
 *                 example: Smartphones
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 description: URL-friendly category identifier
 *                 example: smartphones
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Category description
 *                 example: Latest smartphones and mobile devices
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Parent category ID for hierarchical categories
 *                 example: f47ac10b-58cc-4372-a567-0e02b2c3d481
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Category'
 *                 - type: object
 *                   properties:
 *                     parent:
 *                       $ref: '#/components/schemas/Category'
 *                       nullable: true
 *                     children:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error or parent category not found
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
 *                     - field: name
 *                       message: Name is required
 *               slug_exists:
 *                 summary: Slug already exists
 *                 value:
 *                   error: Category slug already exists in this store
 *               parent_not_found:
 *                 summary: Parent category not found
 *                 value:
 *                   error: Parent category not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieves all categories for the current tenant with pagination and filtering
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Category'
 *                       - type: object
 *                         properties:
 *                           parent:
 *                             $ref: '#/components/schemas/Category'
 *                             nullable: true
 *                           children:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Category'
 *                           _count:
 *                             type: object
 *                             properties:
 *                               products:
 *                                 type: integer
 *                                 description: Number of products in this category
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
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieves a specific category by its ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: id
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d481
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Category'
 *                 - type: object
 *                   properties:
 *                     parent:
 *                       $ref: '#/components/schemas/Category'
 *                       nullable: true
 *                     children:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                       description: Active products in this category
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Category not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     description: Updates an existing category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: id
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d481
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Category name
 *                 example: Smartphones
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 description: URL-friendly category identifier
 *                 example: smartphones
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Category description
 *                 example: Latest smartphones and mobile devices
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Parent category ID for hierarchical categories
 *                 example: f47ac10b-58cc-4372-a567-0e02b2c3d481
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Category'
 *                 - type: object
 *                   properties:
 *                     parent:
 *                       $ref: '#/components/schemas/Category'
 *                       nullable: true
 *                     children:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error or invalid parent category
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
 *                     - field: name
 *                       message: Name is required
 *               slug_exists:
 *                 summary: Slug already exists
 *                 value:
 *                   error: Category slug already exists in this store
 *               self_parent:
 *                 summary: Cannot be own parent
 *                 value:
 *                   error: Category cannot be its own parent
 *               parent_not_found:
 *                 summary: Parent category not found
 *                 value:
 *                   error: Parent category not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Category not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     description: Soft deletes a category (cannot delete if it has subcategories or products)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: id
 *         in: path
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d481
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Category deleted successfully
 *       400:
 *         description: Cannot delete category with subcategories or products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               has_subcategories:
 *                 summary: Has subcategories
 *                 value:
 *                   error: Cannot delete category with subcategories
 *               has_products:
 *                 summary: Has products
 *                 value:
 *                   error: Cannot delete category with products
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Category not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.use(tenantResolver);
router.use(authenticateToken);
router.use(requireStoreOwner);

router.post(
  '/',
  validate(schemas.category),
  auditMiddleware('CREATE', 'CATEGORY'),
  createCategory
);

router.get(
  '/',
  validateQuery(schemas.paginationLarge),
  getCategories
);

router.get('/:id', getCategoryById);

router.put(
  '/:id',
  validate(schemas.category),
  auditMiddleware('UPDATE', 'CATEGORY'),
  updateCategory
);

router.delete(
  '/:id',
  auditMiddleware('DELETE', 'CATEGORY'),
  deleteCategory
);

module.exports = router;