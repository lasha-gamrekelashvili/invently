import { AdminService } from '../services/AdminService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const adminService = new AdminService();

/**
 * Gets all tenants with filtering and pagination
 */
const getAllTenants = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', isActive } = req.query;

    const result = await adminService.getAllTenants(
      { search, sortBy, sortOrder, isActive },
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get all tenants error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets a tenant by ID
 */
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await adminService.getTenantById(id);

    res.json(ApiResponse.success(tenant));
  } catch (error) {
    if (error.message === 'Tenant not found') {
      return res.status(404).json(ApiResponse.notFound('Tenant'));
    }
    console.error('Get tenant by ID error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Updates tenant status
 */
const updateTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const tenant = await adminService.updateTenantStatus(id, isActive);

    res.json(ApiResponse.updated(tenant, 'Tenant status updated successfully'));
  } catch (error) {
    if (error.message === 'Tenant not found') {
      return res.status(404).json(ApiResponse.notFound('Tenant'));
    }
    console.error('Update tenant status error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets all users with filtering and pagination
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const result = await adminService.getAllUsers(
      { search, role, sortBy, sortOrder },
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, tenantId, userId, resource, action } = req.query;

    const result = await adminService.getAuditLogs(
      { tenantId, userId, resource, action },
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets system statistics
 */
const getSystemStats = async (req, res) => {
  try {
    const result = await adminService.getSystemStats();

    res.json(ApiResponse.success(result));
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export default {
  getAllTenants,
  getTenantById,
  updateTenantStatus,
  getAllUsers,
  getAuditLogs,
  getSystemStats
};