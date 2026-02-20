import axios from 'axios';
import type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
  Tenant,
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
  UpdateStoreSettingsData,
  Payment,
  Subscription
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
  
  // For production - use same-origin /api (Caddy proxies to backend for all domains)
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management - per-tenant, resolved dynamically per request
let authTokenOverride: string | null = null;

export const setAuthToken = (token: string | null) => {
  authTokenOverride = token;
};


// Function to check if we're on a subdomain or custom domain
export const isOnSubdomain = () => {
  const host = window.location.hostname.replace(/^www\./, '');
  
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  if (host.endsWith('.localhost')) return true;
  
  const mainDomains = ['shopu.ge', 'momigvare.ge'];
  if (mainDomains.includes(host)) return false;
  
  return true;
};

// Path segments that indicate first segment is tenant slug
const TENANT_PATH_SEGMENTS = ['dashboard', 'categories', 'products', 'orders', 'settings', 'appearance', 'billing', 'bulk-upload', 'platform', 'payment', 'login'];

/**
 * Get tenant slug from main-domain path (e.g. /lasha/dashboard -> lasha, /lasha/login -> lasha)
 */
export const getTenantSlugFromPath = (): string | null => {
  const host = window.location.hostname;
  const mainDomains = ['shopu.ge', 'momigvare.ge', 'localhost', '127.0.0.1'];
  if (!mainDomains.includes(host)) return null;

  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const [first, second] = segments;
  if (second && TENANT_PATH_SEGMENTS.includes(second)) return first;
  return null;
};

const TOKEN_KEY_PREFIX = 'token_';

export const getTokenForTenant = (tenantSlug: string): string | null =>
  localStorage.getItem(`${TOKEN_KEY_PREFIX}${tenantSlug}`);

export const setTokenForTenant = (tenantSlug: string, token: string) =>
  localStorage.setItem(`${TOKEN_KEY_PREFIX}${tenantSlug}`, token);

export const clearTokenForTenant = (tenantSlug: string) =>
  localStorage.removeItem(`${TOKEN_KEY_PREFIX}${tenantSlug}`);

/**
 * Build dashboard base path for a tenant (e.g. /commercia)
 */
export const getDashboardBasePath = (tenantSlug: string) => `/${tenantSlug}`;

// Request interceptor: use token for current tenant (per-tenant auth for multi-shop login)
api.interceptors.request.use((config) => {
  const tenantSlug = getTenantSlugFromPath();
  const token = authTokenOverride ?? (tenantSlug ? getTokenForTenant(tenantSlug) : null);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Original-Host'] = window.location.hostname;
  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }
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
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      const isOnLoginPage = window.location.pathname.includes('/login');

      if (!isAuthRequest && !isOnLoginPage) {
        const slug = getTenantSlugFromPath();
        if (slug) clearTokenForTenant(slug);
        window.location.href = slug ? `/${slug}/login` : '/login';
      }
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

  updateIban: (iban: string): Promise<{ user: User }> =>
    api.put('/auth/iban', { iban }).then(res => res.data),

  updateProfile: (data: { email?: string }): Promise<{ user: User }> =>
    api.put('/auth/profile', data).then(res => res.data),

  verifyEmail: (code: string): Promise<{ user: User }> =>
    api.post('/auth/verify-email', { code }).then(res => res.data),

  resendEmailConfirmation: (): Promise<{ message: string }> =>
    api.post('/auth/resend-email-confirmation').then(res => res.data),

  requestPasswordReset: (email: string): Promise<{ message: string }> =>
    api.post('/auth/password-reset/request', { email }).then(res => res.data),

  resetPassword: (email: string, code: string, newPassword: string): Promise<{ message: string }> =>
    api.post('/auth/password-reset/reset', { email, code, newPassword }).then(res => res.data),

  sendPasswordResetCode: (): Promise<{ message: string }> =>
    api.post('/auth/password-reset/send-code').then(res => res.data),

  changePassword: (code: string, newPassword: string): Promise<{ message: string }> =>
    api.post('/auth/password-reset/change', { code, newPassword }).then(res => res.data),
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

  getOrder: (orderId: string): Promise<{ orderNumber: string; paymentStatus: string }> =>
    api.get(`/storefront/orders/${orderId}`).then(res => res.data),

  getPaymentFailureDetails: (
    orderId: string
  ): Promise<{
    order_status?: string;
    reject_reason?: string | null;
    payment_code?: string | null;
    code_description?: string | null;
  } | null> =>
    api.get(`/storefront/orders/${orderId}/payment-details`).then(res => res.data),
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

// Utility function to get current subdomain from URL
export const getCurrentSubdomain = (): string | null => {
  const host = window.location.hostname;
  
  // Handle localhost subdomains (e.g., furniture.localhost)
  if (host.includes('localhost')) {
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null;
  }
  
  // Handle production subdomains (e.g., furniture.shopu.ge)
  const parts = host.split('.');
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
};

// Settings API
export const settingsAPI = {
  getSettings: (): Promise<StoreSettings> =>
    api.get('/settings').then(res => res.data),

  updateSettings: (data: UpdateStoreSettingsData): Promise<{ data: StoreSettings; message: string }> =>
    api.put('/settings', data).then(res => res.data),

  updateTenantSubdomain: (subdomain: string): Promise<{ tenant: Tenant }> =>
    api.put('/settings/tenant/subdomain', { subdomain }).then(res => res.data),

  updateTenantCustomDomain: (customDomain: string | null): Promise<{ tenant: Tenant; message?: string }> =>
    api.put('/settings/tenant/custom-domain', { customDomain }).then(res => res.data),
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

// Payment API
export const paymentAPI = {
  processPayment: (paymentId: string): Promise<{ redirectUrl?: string; paymentId?: string }> =>
    api.post(`/payments/${paymentId}/process`).then(res => res.data),

  getPayment: (paymentId: string): Promise<Payment> =>
    api.get(`/payments/${paymentId}`).then(res => res.data),

  verifyPayment: (paymentId: string): Promise<Payment> =>
    api.get(`/payments/${paymentId}/verify`).then(res => res.data),

  getUserPayments: (): Promise<Payment[]> =>
    api.get('/payments/user/payments').then(res => res.data),

  getPendingSetupFee: (): Promise<Payment> =>
    api.get('/payments/user/pending-setup-fee').then(res => res.data),

  getTenantPayments: (): Promise<Payment[]> =>
    api.get('/payments/tenant/payments').then(res => res.data),

  getSubscription: (): Promise<Subscription> =>
    api.get('/payments/subscription').then(res => res.data),

  cancelSubscription: (): Promise<Subscription> =>
    api.post('/payments/subscription/cancel').then(res => res.data),

  reactivateSubscription: (): Promise<Subscription> =>
    api.post('/payments/subscription/reactivate').then(res => res.data),
};

export default api;