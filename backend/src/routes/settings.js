import express from 'express';
const router = express.Router();
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateToken, requireStoreOwner } from '../middleware/auth.js';
import tenantResolver from '../middleware/tenantResolver.js';

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get store settings
 *     description: Retrieves all settings for the current tenant's store
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     tenantId:
 *                       type: string
 *                       format: uuid
 *                     aboutUs:
 *                       type: string
 *                       nullable: true
 *                     contact:
 *                       type: string
 *                       nullable: true
 *                     privacyPolicy:
 *                       type: string
 *                       nullable: true
 *                     termsOfService:
 *                       type: string
 *                       nullable: true
 *                     shippingInfo:
 *                       type: string
 *                       nullable: true
 *                     returns:
 *                       type: string
 *                       nullable: true
 *                     faq:
 *                       type: string
 *                       nullable: true
 *                     facebookUrl:
 *                       type: string
 *                       nullable: true
 *                     twitterUrl:
 *                       type: string
 *                       nullable: true
 *                     instagramUrl:
 *                       type: string
 *                       nullable: true
 *                     linkedinUrl:
 *                       type: string
 *                       nullable: true
 *                     youtubeUrl:
 *                       type: string
 *                       nullable: true
 *                     trackOrderUrl:
 *                       type: string
 *                       nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update store settings
 *     description: Updates settings for the current tenant's store
 *     tags: [Settings]
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
 *             properties:
 *               aboutUs:
 *                 type: string
 *                 description: About us page content
 *                 example: We are a premium electronics store...
 *               contact:
 *                 type: string
 *                 description: Contact information
 *                 example: Email us at support@example.com
 *               privacyPolicy:
 *                 type: string
 *                 description: Privacy policy content
 *               termsOfService:
 *                 type: string
 *                 description: Terms of service content
 *               shippingInfo:
 *                 type: string
 *                 description: Shipping information
 *               returns:
 *                 type: string
 *                 description: Return policy information
 *               faq:
 *                 type: string
 *                 description: Frequently asked questions
 *               facebookUrl:
 *                 type: string
 *                 description: Facebook page URL
 *                 example: https://facebook.com/mystore
 *               twitterUrl:
 *                 type: string
 *                 description: Twitter profile URL
 *               instagramUrl:
 *                 type: string
 *                 description: Instagram profile URL
 *               linkedinUrl:
 *                 type: string
 *                 description: LinkedIn profile URL
 *               youtubeUrl:
 *                 type: string
 *                 description: YouTube channel URL
 *               trackOrderUrl:
 *                 type: string
 *                 description: Order tracking URL
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: Settings updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// Apply middleware
router.use(tenantResolver);
router.use(authenticateToken);
router.use(requireStoreOwner);

// GET /api/settings
router.get('/', getSettings);

// PUT /api/settings
router.put('/', updateSettings);

export default router;