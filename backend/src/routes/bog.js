import express from 'express';
import { handleBOGCallback } from '../controllers/bogController.js';

const router = express.Router();

// Body is raw Buffer from express.raw() middleware
router.post('/callback', handleBOGCallback);

export default router;
