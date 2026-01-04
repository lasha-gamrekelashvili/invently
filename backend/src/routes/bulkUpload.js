import express from 'express';
import bulkUploadController from '../controllers/bulkUploadController.js';
import { authenticateToken, requireStoreOwner } from '../middleware/auth.js';
import tenantResolver from '../middleware/tenantResolver.js';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantResolver);
router.use(requireStoreOwner);

// Upload CSV file for bulk import
router.post(
  '/upload',
  bulkUploadController.uploadMiddleware,
  bulkUploadController.importCSV
);

// Download CSV template
router.get('/template', bulkUploadController.downloadTemplate);

export default router;

