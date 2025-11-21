const express = require('express');
const {
  upload,
  uploadProductImage,
  addProductImageByUrl,
  getProductImages,
  updateProductImage,
  deleteProductImage
} = require('../controllers/mediaController');
const { authenticateToken, requireStoreOwner } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

const router = express.Router();

/**
 * @swagger
 * /media/products/{productId}/images:
 *   post:
 *     summary: Upload product image
 *     description: Uploads an image for a specific product
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: productId
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF, WebP - max 5MB)
 *               altText:
 *                 type: string
 *                 description: Alt text for accessibility
 *                 example: iPhone 15 Pro front view
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *                 description: Display order of the image
 *                 example: 1
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductImage'
 *       400:
 *         description: Validation error or no file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               no_file:
 *                 summary: No file uploaded
 *                 value:
 *                   error: No file uploaded
 *               invalid_file_type:
 *                 summary: Invalid file type
 *                 value:
 *                   error: Invalid file type. Only images are allowed.
 *               file_too_large:
 *                 summary: File too large
 *                 value:
 *                   error: File too large
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
 * /media/products/{productId}/images:
 *   get:
 *     summary: Get product images
 *     description: Retrieves all images for a specific product
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: productId
 *         in: path
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d482
 *     responses:
 *       200:
 *         description: Product images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductImage'
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
 * /media/images/{imageId}:
 *   put:
 *     summary: Update product image
 *     description: Updates an existing product image (alt text and sort order)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: imageId
 *         in: path
 *         required: true
 *         description: Image ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d483
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               altText:
 *                 type: string
 *                 description: Alt text for accessibility
 *                 example: iPhone 15 Pro side view
 *               sortOrder:
 *                 type: integer
 *                 minimum: 0
 *                 description: Display order of the image
 *                 example: 2
 *     responses:
 *       200:
 *         description: Image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductImage'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Image not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /media/images/{imageId}:
 *   delete:
 *     summary: Delete product image
 *     description: Soft deletes a product image
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHost'
 *       - name: imageId
 *         in: path
 *         required: true
 *         description: Image ID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d483
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Image deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Image not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.use(tenantResolver);
router.use(authenticateToken);
router.use(requireStoreOwner);

router.post(
  '/products/:productId/images',
  upload.single('image'),
  uploadProductImage
);

router.post(
  '/products/:productId/images/url',
  addProductImageByUrl
);

router.get('/products/:productId/images', getProductImages);

router.put(
  '/images/:imageId',
  updateProductImage
);

router.delete(
  '/images/:imageId',
  deleteProductImage
);

module.exports = router;