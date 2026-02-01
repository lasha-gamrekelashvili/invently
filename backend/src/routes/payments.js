import express from 'express';
import {
  processPayment,
  getPayment,
  getUserPayments,
  getTenantPayments,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  getPendingSetupFee,
} from '../controllers/paymentController.js';
import { authenticateToken, requireStoreOwner } from '../middleware/auth.js';
import tenantResolver from '../middleware/tenantResolver.js';
import { validate, schemas } from '../utils/validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment and subscription management endpoints
 */

/**
 * @swagger
 * /api/payments/{paymentId}/process:
 *   post:
 *     summary: Process a payment (mock payment gateway)
 *     description: Processes a payment using the mock payment gateway. For setup fees, this activates the tenant and creates a subscription upon success.
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID to process
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 example: MOCK
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:paymentId/process', validate(schemas.processPayment), processPayment);

// Authenticated routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/payments/user/payments:
 *   get:
 *     summary: Get all payments for the authenticated user
 *     description: Returns all payments made by the authenticated user across all their tenants
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/user/payments', getUserPayments);

/**
 * @swagger
 * /api/payments/user/pending-setup-fee:
 *   get:
 *     summary: Get pending setup fee payment
 *     description: Returns the pending setup fee payment for the user. If an old tenant without a subscription exists, automatically creates a setup fee payment.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending setup fee payment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       404:
 *         description: No pending setup fee payment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Pending setup fee payment not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/user/pending-setup-fee', getPendingSetupFee);

/**
 * @swagger
 * /api/payments/subscription:
 *   get:
 *     summary: Get current subscription
 *     description: Returns the current subscription for the tenant. If a paid setup fee exists but no subscription is found, automatically creates the subscription (recovery for old tenants).
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Subscription not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Subscription not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/subscription', getSubscription);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment by ID
 *     description: Returns a specific payment by its ID. User must own the payment.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:paymentId', getPayment);

// Tenant-scoped routes
router.use(tenantResolver);
router.use(requireStoreOwner);

/**
 * @swagger
 * /api/payments/tenant/payments:
 *   get:
 *     summary: Get all payments for the current tenant
 *     description: Returns all payments associated with the current tenant (requires active tenant)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenant payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Tenant not found or inactive
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/tenant/payments', getTenantPayments);

/**
 * @swagger
 * /api/payments/subscription/cancel:
 *   post:
 *     summary: Cancel subscription
 *     description: Cancels the current subscription. Uses end-of-period cancellation - tenant remains active until currentPeriodEnd, then is automatically deactivated.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *                 message:
 *                   type: string
 *                   example: Subscription cancelled successfully
 *       404:
 *         description: Subscription not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/subscription/cancel', cancelSubscription);

/**
 * @swagger
 * /api/payments/subscription/reactivate:
 *   post:
 *     summary: Reactivate subscription
 *     description: Reactivates a cancelled or expired subscription. If cancelled but period hasn't expired, resumes current period without new payment. If expired, creates new payment and starts new period.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *                 message:
 *                   type: string
 *                   example: Subscription reactivated successfully
 *       404:
 *         description: Subscription or tenant not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/subscription/reactivate', reactivateSubscription);

export default router;
