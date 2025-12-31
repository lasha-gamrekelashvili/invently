import { MediaRepository } from '../repositories/MediaRepository.js';
import { ProductRepository } from '../repositories/ProductRepository.js';

export class MediaService {
  constructor() {
    this.mediaRepository = new MediaRepository();
    this.productRepository = new ProductRepository();
  }

  async uploadProductImage(productId, tenantId, fileData, metadata = {}) {
    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findByIdAndTenant(productId, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    const { filename, path } = fileData;
    const { altText = '', sortOrder = 0 } = metadata;

    const imageUrl = `/api/images/${filename}`;

    const productImage = await this.mediaRepository.createProductImage({
      url: imageUrl,
      altText,
      filename,
      productId,
      tenantId,
      sortOrder: parseInt(sortOrder),
    });

    return productImage;
  }

  async addProductImageByUrl(productId, tenantId, imageData) {
    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findByIdAndTenant(productId, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    const { url, altText = '', sortOrder = 0 } = imageData;

    if (!url) {
      throw new Error('Image URL is required');
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      throw new Error('Invalid URL format');
    }

    // Extract filename from URL for storage purposes
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1] || `image-${Date.now()}`;

    const productImage = await this.mediaRepository.createProductImage({
      url,
      altText,
      filename,
      productId,
      tenantId,
      sortOrder: parseInt(sortOrder),
    });

    return productImage;
  }

  async getProductImages(productId, tenantId) {
    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findByIdAndTenant(productId, tenantId);

    if (!product) {
      throw new Error('Product not found');
    }

    const images = await this.mediaRepository.findByProductId(productId);

    return images;
  }

  async updateProductImage(imageId, tenantId, updateData) {
    // Verify image exists and belongs to tenant
    const existingImage = await this.mediaRepository.findByIdAndTenant(imageId, tenantId);

    if (!existingImage) {
      throw new Error('Image not found');
    }

    const { altText, sortOrder } = updateData;

    const updatePayload = {};
    if (altText !== undefined) updatePayload.altText = altText;
    if (sortOrder !== undefined) updatePayload.sortOrder = parseInt(sortOrder);

    const image = await this.mediaRepository.updateProductImage(imageId, updatePayload);

    return image;
  }

  async deleteProductImage(imageId, tenantId) {
    // Verify image exists and belongs to tenant
    const image = await this.mediaRepository.findByIdAndTenant(imageId, tenantId);

    if (!image) {
      throw new Error('Image not found');
    }

    await this.mediaRepository.deleteProductImage(imageId);

    return { message: 'Image deleted successfully' };
  }
}
