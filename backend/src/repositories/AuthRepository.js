import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';

export class AuthRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
  }

  /**
   * Finds a user by email (case-insensitive)
   */
  async findByEmail(email, options = {}) {
    return await this.findFirst({ 
      email: {
        equals: email,
        mode: 'insensitive'
      }
    }, options);
  }

  /**
   * Finds a user by email with owned tenants (case-insensitive)
   */
  async findByEmailWithTenants(email) {
    return await this.findFirst(
      { 
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      {
        include: {
          ownedTenants: {},
        },
      }
    );
  }

  /**
   * Finds a user by ID with owned tenants
   */
  async findByIdWithTenants(id) {
    return await this.findFirst(
      { id },
      {
        include: {
          ownedTenants: {},
        },
      }
    );
  }

  /**
   * Creates a new user
   */
  async createUser(data) {
    return await this.create(data);
  }

  /**
   * Creates a user with their first tenant in a transaction
   */
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
