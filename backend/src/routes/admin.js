import express from 'express';
import adminController from '../controllers/adminController.js';
const {
  getAllTenants,
  getTenantById,
  updateTenantStatus,
  getAllUsers,
  getAuditLogs,
  getSystemStats
} = adminController;
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Retrieves platform-wide statistics and recent activity
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalTenants:
 *                       type: integer
 *                       description: Total number of tenants
 *                       example: 150
 *                     activeTenants:
 *                       type: integer
 *                       description: Number of active tenants
 *                       example: 142
 *                     totalUsers:
 *                       type: integer
 *                       description: Total number of users
 *                       example: 150
 *                     totalProducts:
 *                       type: integer
 *                       description: Total number of products
 *                       example: 1250
 *                     totalCategories:
 *                       type: integer
 *                       description: Total number of categories
 *                       example: 89
 *                 recentTenants:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Tenant'
 *                       - type: object
 *                         properties:
 *                           owner:
 *                             type: object
 *                             properties:
 *                               email:
 *                                 type: string
 *                                 format: email
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Platform admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /admin/tenants:
 *   get:
 *     summary: Get all tenants
 *     description: Retrieves all tenants with pagination and filtering (Platform Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - name: isActive
 *         in: query
 *         description: Filter by tenant status
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: Tenants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenants:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Tenant'
 *                       - type: object
 *                         properties:
 *                           owner:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               email:
 *                                 type: string
 *                                 format: email
 *                           _count:
 *                             type: object
 *                             properties:
 *                               categories:
 *                                 type: integer
 *                               products:
 *                                 type: integer
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Platform admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /admin/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     description: Retrieves detailed information about a specific tenant (Platform Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Tenant ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d480
 *     responses:
 *       200:
 *         description: Tenant details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Tenant'
 *                 - type: object
 *                   properties:
 *                     owner:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                           format: email
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     categories:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Category'
 *                           - type: object
 *                             properties:
 *                               _count:
 *                                 type: object
 *                                 properties:
 *                                   products:
 *                                     type: integer
 *                     products:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Product'
 *                           - type: object
 *                             properties:
 *                               category:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                     format: uuid
 *                                   name:
 *                                     type: string
 *                     _count:
 *                       type: object
 *                       properties:
 *                         categories:
 *                           type: integer
 *                         products:
 *                           type: integer
 *                         productImages:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Platform admin access required
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Tenant not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /admin/tenants/{id}/status:
 *   put:
 *     summary: Update tenant status
 *     description: Activates or deactivates a tenant (Platform Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Tenant ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d480
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Whether the tenant should be active
 *                 example: false
 *     responses:
 *       200:
 *         description: Tenant status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Tenant'
 *                 - type: object
 *                   properties:
 *                     owner:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                           format: email
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Platform admin access required
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Tenant not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves all users with pagination and filtering (Platform Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - name: role
 *         in: query
 *         description: Filter by user role
 *         schema:
 *           type: string
 *           enum: [PLATFORM_ADMIN, STORE_OWNER]
 *           example: STORE_OWNER
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/User'
 *                       - type: object
 *                         properties:
 *                           ownedTenants:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 name:
 *                                   type: string
 *                                 subdomain:
 *                                   type: string
 *                                 isActive:
 *                                   type: boolean
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Platform admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieves system audit logs with filtering (Platform Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: tenantId
 *         in: query
 *         description: Filter by tenant ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d480
 *       - name: userId
 *         in: query
 *         description: Filter by user ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d479
 *       - name: resource
 *         in: query
 *         description: Filter by resource type
 *         schema:
 *           type: string
 *           example: PRODUCT
 *       - name: action
 *         in: query
 *         description: Filter by action type
 *         schema:
 *           type: string
 *           example: CREATE
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/AuditLog'
 *                       - type: object
 *                         properties:
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               email:
 *                                 type: string
 *                                 format: email
 *                           tenant:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               subdomain:
 *                                 type: string
 *                             nullable: true
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Platform admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Platform admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.use(authenticateToken);
router.use(requirePlatformAdmin);

router.get('/stats', getSystemStats);
router.get('/tenants', getAllTenants);
router.get('/tenants/:id', getTenantById);
router.put(
  '/tenants/:id/status',
  updateTenantStatus
);
router.get('/users', getAllUsers);
router.get('/audit-logs', getAuditLogs);

export default router;