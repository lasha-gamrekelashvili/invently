import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class AuthRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email, options = {}) {
    return await this.findFirst({ email }, options);
  }

  async findByEmailWithTenants(email) {
    return await this.findFirst(
      { email },
      {
        include: {
          ownedTenants: {
            where: {
              isActive: true,
            },
          },
        },
      }
    );
  }

  async findByIdWithTenants(id) {
    return await this.findFirst(
      { id },
      {
        include: {
          ownedTenants: {
            where: {
              isActive: true,
            },
          },
        },
      }
    );
  }

  async createUser(data) {
    return await this.create(data);
  }

  async createUserWithTenant(userData, tenantData) {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      });

      const tenant = await tx.tenant.create({
        data: {
          ...tenantData,
          ownerId: user.id,
        },
      });

      return { user, tenant };
    });
  }
}
