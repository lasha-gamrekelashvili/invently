const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticateToken, requireStoreOwner } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');

// Apply middleware
router.use(tenantResolver);
router.use(authenticateToken);
router.use(requireStoreOwner);

// GET /api/settings
router.get('/', getSettings);

// PUT /api/settings
router.put('/', updateSettings);

module.exports = router;