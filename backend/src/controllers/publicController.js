import { TenantRepository } from '../repositories/TenantRepository.js';

export const getActiveTenants = async (req, res) => {
  try {
    const tenantRepo = new TenantRepository();
    
    // Get all active tenants with basic info only
    const tenants = await tenantRepo.findMany(
      { isActive: true },
      {
        select: {
          id: true,
          name: true,
          subdomain: true
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      }
    );

    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Error fetching active tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stores'
    });
  }
};