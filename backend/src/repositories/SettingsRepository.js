import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class SettingsRepository extends BaseRepository {
  constructor() {
    super(prisma.storeSettings);
  }

  /**
   * Finds settings by tenant ID
   */
  async findByTenantId(tenantId, options = {}) {
    return await this.findFirst({ tenantId }, options);
  }

  async upsertSettings(tenantId, data) {
    return await this.prisma.storeSettings.upsert({
      where: { tenantId },
      update: data,
      create: {
        tenantId,
        ...data,
      },
    });
  }

  /**
   * Creates default settings for a tenant
   */
  async createDefaultSettings(tenantId) {
    return await this.create({ tenantId });
  }
}
