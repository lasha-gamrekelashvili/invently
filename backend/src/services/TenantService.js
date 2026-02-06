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

  /**
   * Updates tenant's custom domain
   * 
   * Note: Custom domain is optional and allows users to use their own domain
   * instead of subdomain.shopu.ge format
   */
  async updateCustomDomain(tenantId, customDomain, userId) {
    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Verify the user owns this tenant
    if (tenant.ownerId !== userId) {
      throw new Error('Unauthorized: You do not own this tenant');
    }

    // Normalize custom domain (remove trailing slash, lowercase)
    let normalizedDomain = customDomain;
    if (normalizedDomain) {
      normalizedDomain = normalizedDomain.trim().toLowerCase();
      // Remove http:// or https:// if present
      normalizedDomain = normalizedDomain.replace(/^https?:\/\//, '');
      // Remove trailing slash
      normalizedDomain = normalizedDomain.replace(/\/$/, '');
      // Remove port if present
      normalizedDomain = normalizedDomain.split(':')[0];
      
      // If empty after normalization, set to null
      if (normalizedDomain === '') {
        normalizedDomain = null;
      }
    } else {
      normalizedDomain = null;
    }

    // Check if custom domain is already taken by another tenant
    if (normalizedDomain) {
      const existingTenant = await this.tenantRepository.findByCustomDomain(normalizedDomain);
      if (existingTenant && existingTenant.id !== tenantId) {
        throw new Error('Custom domain already taken');
      }
    }

    // Update the custom domain
    const updatedTenant = await this.tenantRepository.update(tenantId, {
      customDomain: normalizedDomain,
    });

    return {
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        subdomain: updatedTenant.subdomain,
        customDomain: updatedTenant.customDomain,
        description: updatedTenant.description,
        isActive: updatedTenant.isActive,
      },
    };
  }
}
