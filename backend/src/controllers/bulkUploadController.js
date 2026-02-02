import { BulkUploadService } from '../services/BulkUploadService.js';
import { ApiResponse } from '../utils/responseFormatter.js';
import multer from 'multer';

const bulkUploadService = new BulkUploadService();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

const bulkUploadController = {
  uploadMiddleware: upload.single('file'),

  /**
   * Imports products and categories from CSV
   */
  async importCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(ApiResponse.error('No file uploaded'));
      }

      const tenantId = req.tenantId;
      const csvContent = req.file.buffer.toString('utf-8');

      console.log(`Processing CSV upload for tenant ${tenantId}, size: ${req.file.size} bytes`);

      const results = await bulkUploadService.importFromCSV(csvContent, tenantId);

      const summary = {
        categories: {
          created: results.categories.created,
          updated: results.categories.updated,
          errors: results.categories.errors.length,
        },
        products: {
          created: results.products.created,
          updated: results.products.updated,
          errors: results.products.errors.length,
        },
        variants: {
          created: results.variants?.created || 0,
          updated: results.variants?.updated || 0,
        },
        errors: [
          ...results.categories.errors,
          ...results.products.errors,
        ],
      };

      const totalSuccess = results.categories.created + 
                          results.categories.updated + 
                          results.products.created + 
                          results.products.updated +
                          (results.variants?.created || 0) +
                          (results.variants?.updated || 0);
      const totalErrors = results.categories.errors.length + 
                         results.products.errors.length;

      const message = `Import completed: ${totalSuccess} items processed successfully${
        totalErrors > 0 ? `, ${totalErrors} errors` : ''
      }`;

      res.json(ApiResponse.success(summary, message));
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json(ApiResponse.error('Failed to import CSV', error.message));
    }
  },

  /**
   * Downloads CSV template
   */
  async downloadTemplate(req, res) {
    try {
      const template = bulkUploadService.generateTemplate();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="bulk-upload-template.csv"');
      res.send(template);
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json(ApiResponse.error('Failed to generate template', error.message));
    }
  },
};

export default bulkUploadController;

