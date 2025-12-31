import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class MediaRepository extends BaseRepository {
  constructor() {
    super(prisma.productImage);
  }

  async findByProductId(productId, options = {}) {
    return await this.findMany(
      { productId },
      {
        orderBy: { sortOrder: 'asc' },
        ...options,
      }
    );
  }

  async findByIdAndTenant(id, tenantId, options = {}) {
    return await this.findFirst({ id, tenantId }, options);
  }

  async createProductImage(data) {
    return await this.create(data);
  }

  async updateProductImage(id, data) {
    return await this.update(id, data);
  }

  async deleteProductImage(id) {
    return await this.delete(id);
  }

  async countByProduct(productId) {
    return await this.count({ productId });
  }
}
