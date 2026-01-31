import axios from 'axios';
import type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
  Category,
  Product,
  ProductVariant,
  CreateCategoryData,
  CreateProductData,
  CreateVariantData,
  UpdateVariantData,
  PaginatedResponse,
  PaginationParams,
  Cart,
  Order,
  OrderStats,
  CreateOrderData,
  StoreSettings,
  UpdateStoreSettingsData
} from '../types';

// Debounce utility function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Determine the correct API base URL based on environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // For localhost development - check for localhost in any form
  if (hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.endsWith('.localhost') ||  // This covers subdomains like nucushop.localhost
      hostname.includes('localhost')) {
    return 'http://localhost:3001/api';
  }
  
  // For production - use the actual backend URL
  return 'https://momigvare.onrender.com/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};


// Function to check if we're on a subdomain
export const isOnSubdomain = () => {
  const host = window.location.hostname; // furniture.localhost OR furniture.shopu.ge
  
  // Not a subdomain if it's localhost or an IP address
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  
  // localhost special-case: foo.localhost is treated as subdomain
  if (host.endsWith('.localhost')) return true;
  
  // For production domains - check if it's a subdomain of shopu.ge
  if (host.endsWith('.shopu.ge') && host !== 'shopu.ge') return true;
  
  // General case: at least 3 labels = subdomain (e.g., tenant.example.com)
  return host.split('.').length >= 3;
};

// Request interceptor to add auth token and original host
api.interceptors.request.use((config) => {
  const token = authToken || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add the original hostname for tenant resolution
  config.headers['X-Original-Host'] = window.location.hostname;
  
  return config;
});

// Response interceptor for error handling and unwrapping ApiResponse
api.interceptors.response.use(
  (response) => {
    // Unwrap the ApiResponse format from backend
    // Backend returns: { success: true, data: {...}, message?: string, pagination?: {...} }
    // We want to extract the data property and preserve pagination if it exists
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      // This is an ApiResponse format, unwrap it
      const unwrapped: any = {
        ...response,
        data: response.data.data
      };
      
      // Preserve pagination if it exists (for paginated responses)
      if (response.data.pagination) {
        unwrapped.data = {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      
      return unwrapped;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  setToken: (token: string | null) => {
    setAuthToken(token);
  },

  login: (data: LoginData): Promise<AuthResponse> =>
    api.post('/auth/login', data).then(res => res.data),

  register: (data: RegisterData): Promise<AuthResponse> =>
    api.post('/auth/register', data).then(res => res.data),

  me: (): Promise<{ user: User; tenants: any[] }> =>
    api.get('/auth/me').then(res => res.data),
};

// Categories API
export const categoriesAPI = {
  list: (params?: PaginationParams): Promise<PaginatedResponse<Category>> =>
    api.get('/categories', { params }).then(res => res.data),

  create: (data: CreateCategoryData): Promise<Category> =>
    api.post('/categories', data).then(res => res.data),

  update: (id: string, data: Partial<CreateCategoryData>): Promise<Category> =>
    api.put(`/categories/${id}`, data).then(res => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/categories/${id}`).then(res => res.data),

  getById: (id: string): Promise<Category> =>
    api.get(`/categories/${id}`).then(res => res.data),
};

// Products API
export const productsAPI = {
  list: (params?: PaginationParams & { categoryId?: string; isActive?: boolean; isDeleted?: boolean; search?: string; minPrice?: number; maxPrice?: number }): Promise<PaginatedResponse<Product>> =>
    api.get('/products', { params }).then(res => res.data),

  create: (data: CreateProductData): Promise<Product> =>
    api.post('/products', data).then(res => res.data),

  update: (id: string, data: Partial<CreateProductData>): Promise<Product> =>
    api.put(`/products/${id}`, data).then(res => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/products/${id}`).then(res => res.data),

  restore: (id: string): Promise<Product> =>
    api.post(`/products/${id}/restore`).then(res => res.data),

  getById: (id: string): Promise<Product> =>
    api.get(`/products/${id}`).then(res => res.data),

  getBySlug: (slug: string): Promise<Product> =>
    api.get(`/products/slug/${slug}`).then(res => res.data),

  // Variant management
  createVariant: (productId: string, data: CreateVariantData): Promise<ProductVariant> =>
    api.post(`/products/${productId}/variants`, data).then(res => res.data),

  updateVariant: (productId: string, variantId: string, data: UpdateVariantData): Promise<ProductVariant> =>
    api.put(`/products/${productId}/variants/${variantId}`, data).then(res => res.data),

  deleteVariant: (productId: string, variantId: string): Promise<void> =>
    api.delete(`/products/${productId}/variants/${variantId}`).then(res => res.data),
};

// Media API
export const mediaAPI = {
  uploadProductImage: (productId: string, file: File, altText?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('image', file);
    if (altText) formData.append('altText', altText);

    return api.post(`/media/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  addProductImageByUrl: (productId: string, url: string, altText?: string, sortOrder?: number): Promise<any> =>
    api.post(`/media/products/${productId}/images/url`, {
      url,
      altText,
      sortOrder
    }).then(res => res.data),

  getProductImages: (productId: string): Promise<any[]> =>
    api.get(`/media/products/${productId}/images`).then(res => res.data),

  updateProductImage: (imageId: string, data: { altText?: string; sortOrder?: number }): Promise<any> =>
    api.put(`/media/images/${imageId}`, data).then(res => res.data),

  deleteProductImage: (imageId: string): Promise<void> =>
    api.delete(`/media/images/${imageId}`).then(res => res.data),
};

// Storefront API (public)
export const storefrontAPI = {
  getStoreInfo: (): Promise<any> =>
    api.get('/storefront/info').then(res => res.data),

  getCategories: (): Promise<Category[]> =>
    api.get('/storefront/categories').then(res => res.data),

  getProducts: (params?: PaginationParams & { categoryId?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<PaginatedResponse<Product>> =>
    api.get('/storefront/products', { params }).then(res => res.data),

  getProduct: (slug: string): Promise<Product> =>
    api.get(`/storefront/products/${slug}`).then(res => res.data),

  getProductsByCategory: (categorySlug: string, params?: PaginationParams): Promise<{ category: Category; products: Product[]; pagination: any }> =>
    api.get(`/storefront/categories/${categorySlug}/products`, { params }).then(res => res.data),

  getSettings: (): Promise<StoreSettings | null> =>
    api.get('/storefront/settings').then(res => res.data),
};

// Admin API (platform admin)
export const adminAPI = {
  getTenants: (params?: PaginationParams): Promise<PaginatedResponse<any>> =>
    api.get('/admin/tenants', { params }).then(res => res.data),

  getTenant: (id: string): Promise<any> =>
    api.get(`/admin/tenants/${id}`).then(res => res.data),

  updateTenantStatus: (id: string, isActive: boolean): Promise<any> =>
    api.put(`/admin/tenants/${id}/status`, { isActive }).then(res => res.data),

  getUsers: (params?: PaginationParams): Promise<PaginatedResponse<User>> =>
    api.get('/admin/users', { params }).then(res => res.data),

  getAuditLogs: (params?: PaginationParams & { tenantId?: string; userId?: string }): Promise<PaginatedResponse<any>> =>
    api.get('/admin/audit-logs', { params }).then(res => res.data),

  getStats: (): Promise<any> =>
    api.get('/admin/stats').then(res => res.data),
};

// Settings API
export const settingsAPI = {
  getSettings: (): Promise<StoreSettings> =>
    api.get('/settings').then(res => res.data),

  updateSettings: (data: UpdateStoreSettingsData): Promise<{ data: StoreSettings; message: string }> =>
    api.put('/settings', data).then(res => res.data),
};

// Cart API
export const cartAPI = {
  getCart: (sessionId: string): Promise<Cart> =>
    api.get(`/cart/${sessionId}`).then(res => res.data),

  addToCart: (sessionId: string, productId: string, quantity: number = 1, variantId?: string): Promise<any> =>
    api.post(`/cart/${sessionId}/items`, { productId, quantity, variantId }).then(res => res.data),

  updateCartItem: (sessionId: string, itemId: string, quantity: number): Promise<any> =>
    api.put(`/cart/${sessionId}/items/${itemId}`, { quantity }).then(res => res.data),

  removeFromCart: (sessionId: string, itemId: string): Promise<void> =>
    api.delete(`/cart/${sessionId}/items/${itemId}`).then(res => res.data),

  clearCart: (sessionId: string): Promise<void> =>
    api.delete(`/cart/${sessionId}/clear`).then(res => res.data),
};

// Orders API
export const ordersAPI = {
  createOrder: (data: CreateOrderData): Promise<Order> =>
    api.post('/orders', data).then(res => res.data),

  getOrders: (params?: PaginationParams & { status?: string; search?: string; dateFilter?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<Order>> =>
    api.get('/orders', { params }).then(res => res.data),

  getOrder: (id: string): Promise<Order> =>
    api.get(`/orders/${id}`).then(res => res.data),

  updateOrderStatus: (id: string, status: string): Promise<Order> =>
    api.put(`/orders/${id}/status`, { status }).then(res => res.data),

  getOrderStats: (): Promise<OrderStats> =>
    api.get('/orders/stats').then(res => res.data),
};

// Audit Logs API
export const auditLogsAPI = {
  getAuditLogs: (params?: PaginationParams & { action?: string; resource?: string; userId?: string; search?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<any>> =>
    api.get('/audit-logs', { params }).then(res => res.data),

  getAuditLogStats: (): Promise<any> =>
    api.get('/audit-logs/stats').then(res => res.data),
};

// Bulk Upload API
export const bulkUploadAPI = {
  uploadCSV: (file: File): Promise<{ categories: any; products: any; errors: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/bulk-upload/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  downloadTemplate: (): Promise<Blob> =>
    api.get('/bulk-upload/template', {
      responseType: 'blob',
    }).then(res => res.data),
};

export default api;