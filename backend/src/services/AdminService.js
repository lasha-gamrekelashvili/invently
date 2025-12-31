import { TenantRepository } from '../repositories/TenantRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { CategoryRepository } from '../repositories/CategoryRepository.js';
import { ProductRepository } from '../repositories/ProductRepository.js';

export class AdminService {
  constructor() {
    this.tenantRepository = new TenantRepository();
    this.userRepository = new UserRepository();
    this.auditLogRepository = new AuditLogRepository();
    this.categoryRepository = new CategoryRepository();
    this.productRepository = new ProductRepository();
  }

  async getAllTenants(filters = {}, page = 1, limit = 20) {
    const { search, sortBy = 'createdAt', sortOrder = 'desc', isActive } = filters;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { subdomain: { contains: search } },
        { owner: { email: { contains: search } } },
      ];
    }

    const result = await this.tenantRepository.paginateWithOwner(
      where,
      page,
      limit,
      {
        orderBy: { [sortBy]: sortOrder },
      }
    );

    return {
      tenants: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }

  async getTenantById(id) {
    const tenant = await this.tenantRepository.findWithStats(id);

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant;
  }

  async updateTenantStatus(id, isActive) {
    const existingTenant = await this.tenantRepository.findById(id);

    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    const tenant = await this.tenantRepository.findWithOwner(id);
    await this.tenantRepository.updateTenantStatus(id, isActive);

    // Refetch with owner details
    return await this.tenantRepository.findWithOwner(id);
  }

  async getAllUsers(filters = {}, page = 1, limit = 20) {
    const { search, role, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const where = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const result = await this.userRepository.paginateWithTenants(
      where,
      page,
      limit,
      {
        orderBy: { [sortBy]: sortOrder },
      }
    );

    return {
      users: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }

  async getAuditLogs(filters = {}, page = 1, limit = 50) {
    const { tenantId, userId, resource, action } = filters;

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (resource) where.resource = resource;
    if (action) where.action = action;

    const result = await this.auditLogRepository.paginateWithRelations(where, page, limit);

    return {
      logs: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    };
  }

  async getSystemStats() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalProducts,
      totalCategories,
      recentTenants,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ isActive: true }),
      this.userRepository.count(),
      this.productRepository.count(),
      this.categoryRepository.count(),
      this.tenantRepository.findMany(
        {},
        {
          include: {
            owner: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      ),
    ]);

    return {
      stats: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalProducts,
        totalCategories,
      },
      recentTenants,
    };
  }
}
