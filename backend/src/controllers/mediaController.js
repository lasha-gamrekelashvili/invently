const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { altText, sortOrder = 0 } = req.body;
    const tenantId = req.tenantId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const imageUrl = `/api/images/${req.file.filename}`;

    const productImage = await prisma.productImage.create({
      data: {
        url: imageUrl,
        altText: altText || '',
        filename: req.file.filename,
        productId,
        tenantId,
        sortOrder: parseInt(sortOrder)
      }
    });

    res.status(201).json(productImage);
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const tenantId = req.tenantId;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const images = await prisma.productImage.findMany({
      where: {
        productId
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json(images);
  } catch (error) {
    console.error('Get product images error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { altText, sortOrder } = req.body;
    const tenantId = req.tenantId;

    const existingImage = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        tenantId
      }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const updateData = {};
    if (altText !== undefined) updateData.altText = altText;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);

    const image = await prisma.productImage.update({
      where: { id: imageId },
      data: updateData
    });


    res.json(image);
  } catch (error) {
    console.error('Update image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addProductImageByUrl = async (req, res) => {
  try {
    const { productId } = req.params;
    const { url, altText, sortOrder = 0 } = req.body;
    const tenantId = req.tenantId;

    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Extract filename from URL for storage purposes
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1] || `image-${Date.now()}`;

    const productImage = await prisma.productImage.create({
      data: {
        url: url,
        altText: altText || '',
        filename: filename,
        productId,
        tenantId,
        sortOrder: parseInt(sortOrder)
      }
    });

    res.status(201).json(productImage);
  } catch (error) {
    console.error('Add image by URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const tenantId = req.tenantId;

    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        tenantId
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await prisma.productImage.delete({
      where: { id: imageId }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  upload,
  uploadProductImage,
  addProductImageByUrl,
  getProductImages,
  updateProductImage,
  deleteProductImage
};