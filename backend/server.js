import 'dotenv/config';
import express, { json, urlencoded, static as expressStatic } from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

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
import paymentRoutes from './src/routes/payments.js';

import { serve, setup } from './src/config/swagger.js';

import { startSubscriptionExpiryJob, stopSubscriptionExpiryJob } from './src/jobs/subscriptionJobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

let subscriptionJobId = null;

app.use(cors({
  origin: async function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow main domains
    const mainDomains = [
      'https://shopu.ge',
      'http://shopu.ge',
      'https://momigvare.ge',
      'http://momigvare.ge'
    ];
    
    if (mainDomains.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow subdomains of main domains
    const subdomainPatterns = [
      /^https:\/\/[a-zA-Z0-9-]+\.shopu\.ge$/,
      /^http:\/\/[a-zA-Z0-9-]+\.shopu\.ge$/,
      /^https:\/\/[a-zA-Z0-9-]+\.momigvare\.ge$/,
      /^http:\/\/[a-zA-Z0-9-]+\.momigvare\.ge$/
    ];
    
    const isSubdomain = subdomainPatterns.some(pattern => pattern.test(origin));
    if (isSubdomain) {
      return callback(null, true);
    }
    
    // For custom domains, check if they're registered in database
    try {
      const hostname = new URL(origin).hostname.toLowerCase();
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { customDomain: hostname },
            { customDomain: `www.${hostname}` },
            { customDomain: hostname.replace(/^www\./, '') }
          ],
          customDomain: { not: null }
        }
      });
      
      if (tenant) {
        return callback(null, true);
      }
    } catch (error) {
      // If URL parsing fails or database query fails, reject
      console.error('CORS verification error:', error);
    }
    
    // Reject if not verified
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/images', expressStatic(join(__dirname, process.env.UPLOAD_PATH || './uploads')));

app.use('/api/docs', serve, setup);

app.get('/healthz', async (req, res) => {
  try {
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
    await prisma.$queryRaw`SELECT 1`;

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
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Shopu Multi-Tenant Shop API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/healthz',
    readiness: '/readyz'
  });
});

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

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  stopSubscriptionExpiryJob(subscriptionJobId);
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  stopSubscriptionExpiryJob(subscriptionJobId);
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api/docs`);

  subscriptionJobId = startSubscriptionExpiryJob(60 * 60 * 1000);
});