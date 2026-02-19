import express from 'express';
import orderController from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';
import tenantResolver from '../middleware/tenantResolver.js';
import { validate, schemas } from '../utils/validation.js';
import Joi from 'joi';

const router = express.Router();

// Apply tenant middleware
router.use(tenantResolver);

// Validation schemas
// Georgian address format (new)
const georgianAddressSchema = Joi.object({
  region: Joi.string().required(),
  regionName: Joi.object({
    en: Joi.string().required(),
    ka: Joi.string().required(),
  }).optional(),
  district: Joi.string().required(),
  districtName: Joi.object({
    en: Joi.string().required(),
    ka: Joi.string().required(),
  }).optional(),
  address: Joi.string().required(),
  notes: Joi.string().allow('').optional(),
  coordinates: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).allow(null).optional(),
});

// Legacy address format (for backwards compatibility)
const legacyAddressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  country: Joi.string().required(),
});

const createOrderSchema = Joi.object({
  sessionId: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerName: Joi.string().required(),
  shippingAddress: Joi.alternatives()
    .try(georgianAddressSchema, legacyAddressSchema)
    .optional(),
  billingAddress: Joi.alternatives()
    .try(georgianAddressSchema, legacyAddressSchema)
    .optional(),
  notes: Joi.string().allow('').optional(),
  returnOrigin: Joi.string().uri().optional(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED').required(),
});

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart (checkout)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               customerName:
 *                 type: string
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               notes:
 *                 type: string
 *             required:
 *               - sessionId
 *               - customerEmail
 *               - customerName
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request or cart is empty
 *       500:
 *         description: Server error
 */
router.post('/', validate(createOrderSchema), orderController.createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders (admin only)
 *     tags: [Orders]
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
 *         description: Filter by order status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order number, customer email, or name
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, orderController.getOrders);

/**
 * @swagger
 * /api/orders/stats:
 *   get:
 *     summary: Get order statistics for dashboard
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                     monthlyOrders:
 *                       type: integer
 *                     weeklyOrders:
 *                       type: integer
 *                     monthlyRevenue:
 *                       type: number
 *                     recentOrders:
 *                       type: array
 *                     ordersByStatus:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticateToken, orderController.getOrderStats);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, orderController.getOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put('/:id/status', authenticateToken, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;