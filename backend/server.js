import 'dotenv/config';
import express, { json, urlencoded, static as expressStatic } from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// Import routes
import publicRoutes from './src/routes/public.js';
import authRoutes from './src/routes/auth.js';
import categoryRoutes from './src/routes/categories.js';
import productRoutes from './src/routes/products.js';
import mediaRoutes from './src/routes/media.js';
import storefrontRoutes from './src/routes/storefront.js';
import adminRoutes from './src/routes/admin.js';
import cartRoutes from './src/routes/cart.js';
import orderRoutes from './src/routes/orders.js';
import settingsRoutes from './src/routes/settings.js';
import bulkUploadRoutes from './src/routes/bulkUpload.js';

// Import swagger config
import { serve, setup } from './src/config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow your main domain and all subdomains
    const allowedDomains = [
      'https://shopu.ge',
      'http://shopu.ge',
      /^https:\/\/[a-zA-Z0-9-]+\.shopu\.ge$/,
      /^http:\/\/[a-zA-Z0-9-]+\.shopu\.ge$/,
      // Legacy domain support (can be removed later)
      /^https:\/\/[a-zA-Z0-9-]+\.momigvare\.ge$/,
      /^http:\/\/[a-zA-Z0-9-]+\.momigvare\.ge$/
    ];
    
    const isAllowed = allowedDomains.some(domain => {
      if (typeof domain === 'string') {
        return origin === domain;
      } else if (domain instanceof RegExp) {
        return domain.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
app.use('/api/images', expressStatic(join(__dirname, process.env.UPLOAD_PATH || './uploads')));

// API Documentation
app.use('/api/docs', serve, setup);

// Health check endpoints
app.get('/healthz', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/readyz', async (req, res) => {
  try {
    // More comprehensive readiness check
    await prisma.$queryRaw`SELECT 1`;

    // Check if uploads directory exists
    const { existsSync, mkdirSync } = await import('fs');
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uploads: 'available'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Shopu Multi-Tenant Shop API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/healthz',
    readiness: '/readyz'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large' });
  }

  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api/docs`);
});