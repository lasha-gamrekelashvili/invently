import { TenantRepository } from '../repositories/TenantRepository.js';

export class TenantService {
  constructor() {
    this.tenantRepository = new TenantRepository();
  }

  /**
   * Updates tenant's subdomain
   * 
   * Note: Changing subdomain is safe because:
   * - Subdomain is only used for routing/identification (not a foreign key)
   * - All relationships use Tenant.id, not subdomain
   * - The tenantResolver middleware will use the new subdomain after update
   * - Users will need to access the store via the new subdomain URL
   */
  async updateSubdomain(tenantId, newSubdomain, userId) {
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Verify the user owns this tenant
    if (tenant.ownerId !== userId) {
      throw new Error('Unauthorized: You do not own this tenant');
    }

    // Check if subdomain is already taken
    const existingTenant = await this.tenantRepository.findBySubdomain(newSubdomain);
    if (existingTenant && existingTenant.id !== tenantId) {
      throw new Error('Subdomain already taken');
    }

    // Update the subdomain
    const updatedTenant = await this.tenantRepository.update(tenantId, {
      subdomain: newSubdomain,
    });

    return {
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        subdomain: updatedTenant.subdomain,
        description: updatedTenant.description,
        isActive: updatedTenant.isActive,
      },
    };
  }
}
