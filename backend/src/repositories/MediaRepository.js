import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class MediaRepository extends BaseRepository {
  constructor() {
    super(prisma.productImage);
  }

  /**
   * Finds product images by product ID
   */
  async findByProductId(productId, options = {}) {
    return await this.findMany(
      { productId },
      {
        orderBy: { sortOrder: 'asc' },
        ...options,
      }
    );
  }

  /**
   * Finds a product image by ID and tenant ID
   */
  async findByIdAndTenant(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId }, options);
  }

  /**
   * Creates a product image
   */
  async createProductImage(data) {
    return await this.create(data);
  }

  /**
   * Updates a product image
   */
  async updateProductImage(id, data) {
    return await this.update(id, data);
  }

  /**
   * Deletes a product image
   */
  async deleteProductImage(id) {
    return await this.delete(id);
  }

  /**
   * Counts product images by product ID
   */
  async countByProduct(productId) {
    return await this.count({ productId });
  }
}
