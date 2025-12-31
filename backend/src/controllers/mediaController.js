import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { MediaService } from '../services/MediaService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const mediaService = new MediaService();

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
      return res.status(400).json(ApiResponse.error('No file uploaded'));
    }

    const productImage = await mediaService.uploadProductImage(
      productId,
      tenantId,
      {
        filename: req.file.filename,
        path: req.file.path,
      },
      { altText, sortOrder }
    );

    res.status(201).json(ApiResponse.created(productImage, 'Image uploaded successfully'));
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    console.error('Upload image error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const tenantId = req.tenantId;

    const images = await mediaService.getProductImages(productId, tenantId);

    res.json(ApiResponse.success(images));
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    console.error('Get product images error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const updateProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { altText, sortOrder } = req.body;
    const tenantId = req.tenantId;

    const image = await mediaService.updateProductImage(imageId, tenantId, {
      altText,
      sortOrder,
    });

    res.json(ApiResponse.updated(image, 'Image updated successfully'));
  } catch (error) {
    if (error.message === 'Image not found') {
      return res.status(404).json(ApiResponse.notFound('Image'));
    }
    console.error('Update image error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const addProductImageByUrl = async (req, res) => {
  try {
    const { productId } = req.params;
    const { url, altText, sortOrder = 0 } = req.body;
    const tenantId = req.tenantId;

    const productImage = await mediaService.addProductImageByUrl(productId, tenantId, {
      url,
      altText,
      sortOrder,
    });

    res.status(201).json(ApiResponse.created(productImage, 'Image added successfully'));
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json(ApiResponse.notFound('Product'));
    }
    if (error.message === 'Image URL is required' || error.message === 'Invalid URL format') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Add image by URL error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const tenantId = req.tenantId;

    await mediaService.deleteProductImage(imageId, tenantId);

    res.json(ApiResponse.deleted('Image deleted successfully'));
  } catch (error) {
    if (error.message === 'Image not found') {
      return res.status(404).json(ApiResponse.notFound('Image'));
    }
    console.error('Delete image error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export {
  upload,
  uploadProductImage,
  addProductImageByUrl,
  getProductImages,
  updateProductImage,
  deleteProductImage
};