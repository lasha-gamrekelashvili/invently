import express from 'express';
const router = express.Router();
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateToken, requireStoreOwner } from '../middleware/auth.js';
import tenantResolver from '../middleware/tenantResolver.js';

// Apply middleware
router.use(tenantResolver);
router.use(authenticateToken);
router.use(requireStoreOwner);

// GET /api/settings
router.get('/', getSettings);

// PUT /api/settings
router.put('/', updateSettings);

export default router;