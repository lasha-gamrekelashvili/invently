import express from 'express';
import { getActiveTenants } from '../controllers/publicController.js';

const router = express.Router();

/**
 * @swagger
 * /public/stores:
 *   get:
 *     summary: Get list of active stores (public, no auth required)
 *     tags: [Public]
 *     security: []
 *     responses:
 *       200:
 *         description: List of active stores
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       subdomain:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/stores', getActiveTenants);

export default router;