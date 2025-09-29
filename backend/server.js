require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./src/routes/auth');
const categoryRoutes = require('./src/routes/categories');
const productRoutes = require('./src/routes/products');
const mediaRoutes = require('./src/routes/media');
const storefrontRoutes = require('./src/routes/storefront');
const adminRoutes = require('./src/routes/admin');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const auditLogRoutes = require('./src/routes/auditLogs');
const settingsRoutes = require('./src/routes/settings');

// Import swagger config
const swagger = require('./src/config/swagger');

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
app.use('/api/images', express.static(path.join(__dirname, process.env.UPLOAD_PATH || './uploads')));

// API Documentation
app.use('/api/docs', swagger.serve, swagger.setup);

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
    const fs = require('fs');
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
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
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/settings', settingsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Invently Multi-Tenant Shop API',
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