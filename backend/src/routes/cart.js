const express = require('express');
const cartController = require('../controllers/cartController');
const tenantResolver = require('../middleware/tenantResolver');
const { validate, schemas } = require('../utils/validation');
const Joi = require('joi');

const router = express.Router();

// Apply tenant middleware
router.use(tenantResolver);

// Validation schemas
const addToCartSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).default(1),
  variantId: Joi.string().uuid().optional(),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management for storefront
 */

/**
 * @swagger
 * /api/cart/{sessionId}:
 *   get:
 *     summary: Get cart by session ID
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart session ID
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
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
 *                     sessionId:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: number
 *       500:
 *         description: Server error
 */
router.get('/:sessionId', cartController.getCart);

/**
 * @swagger
 * /api/cart/{sessionId}/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               variantId:
 *                 type: string
 *                 format: uuid
 *             required:
 *               - productId
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *       400:
 *         description: Invalid request or insufficient stock
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/:sessionId/items', validate(addToCartSchema), cartController.addToCart);

/**
 * @swagger
 * /api/cart/{sessionId}/items/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart session ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *             required:
 *               - quantity
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Invalid request or insufficient stock
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.put('/:sessionId/items/:itemId', validate(updateCartItemSchema), cartController.updateCartItem);

/**
 * @swagger
 * /api/cart/{sessionId}/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart session ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.delete('/:sessionId/items/:itemId', cartController.removeFromCart);

/**
 * @swagger
 * /api/cart/{sessionId}/clear:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart session ID
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.delete('/:sessionId/clear', cartController.clearCart);

module.exports = router;