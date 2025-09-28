const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

const router = express.Router();

// Apply tenant middleware and authentication
router.use(tenantResolver);
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: Audit log management endpoints
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get audit logs for the tenant
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auditLogController.getAuditLogs);

/**
 * @swagger
 * /api/audit-logs/stats:
 *   get:
 *     summary: Get audit log statistics
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit log statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', auditLogController.getAuditLogStats);

module.exports = router;