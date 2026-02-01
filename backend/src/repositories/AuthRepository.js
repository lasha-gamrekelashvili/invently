import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class AuthRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email, options = {}) {
    // Case-insensitive email search
    return await this.findFirst({ 
      email: {
        equals: email,
        mode: 'insensitive'
      }
    }, options);
  }

  async findByEmailWithTenants(email) {
    // Case-insensitive email search
    return await this.findFirst(
      { 
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      {
        include: {
          ownedTenants: {
            // Include all tenants (active and inactive) for frontend status checking
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
            // Include ALL tenants (active and inactive) so frontend can check status
            // Don't filter by isActive here - let frontend handle it
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
