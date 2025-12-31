import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class SettingsRepository extends BaseRepository {
  constructor() {
    super(prisma.storeSettings);
  }

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

  async createDefaultSettings(tenantId) {
    return await this.create({ tenantId });
  }
}
