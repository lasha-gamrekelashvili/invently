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
  
  // For localhost development
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    const url = 'http://localhost:3001/api';
    console.log('Using localhost API URL:', url);
    return url;
  }
  
  // For production - use the actual backend URL
  const url = 'https://momigvare.onrender.com/api';
  console.log('Using production API URL:', url);
  return url;
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
  const host = window.location.hostname; // furniture.localhost OR furniture.momigvare.ge
  console.log('isOnSubdomain check:', {
    host,
    isLocalhost: host === 'localhost',
    isIP: /^\d+\.\d+\.\d+\.\d+$/.test(host),
    endsWithLocalhost: host.endsWith('.localhost'),
    endsWithMomigvare: host.endsWith('.momigvare.ge'),
    isNotMomigvare: host !== 'momigvare.ge',
    splitLength: host.split('.').length
  });
  
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  // localhost special-case: foo.localhost is treated as subdomain
  if (host.endsWith('.localhost')) return true;
  // real domains: at least 3 labels = subdomain
  // Also check if it's a subdomain of momigvare.ge
  if (host.endsWith('.momigvare.ge') && host !== 'momigvare.ge') return true;
  const result = host.split('.').length >= 3;
  console.log('isOnSubdomain result:', result);
  return result;
};

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = authToken || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
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
    api.post('/auth/login', data).then(res => {
      // Set token immediately so /me right after login works too
      authAPI.setToken(res.data.token);
      return res.data;
    }),

  register: (data: RegisterData): Promise<AuthResponse> =>
    api.post('/auth/register', data).then(res => {
      // Set token immediately so /me right after register works too
      authAPI.setToken(res.data.token);
      return res.data;
    }),

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
  list: (params?: PaginationParams & { categoryId?: string; status?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<PaginatedResponse<Product>> =>
    api.get('/products', { params }).then(res => res.data),

  create: (data: CreateProductData): Promise<Product> =>
    api.post('/products', data).then(res => res.data),

  update: (id: string, data: Partial<CreateProductData>): Promise<Product> =>
    api.put(`/products/${id}`, data).then(res => res.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/products/${id}`).then(res => res.data),

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
  getSettings: (): Promise<{ data: StoreSettings }> =>
    api.get('/settings').then(res => res.data),

  updateSettings: (data: UpdateStoreSettingsData): Promise<{ data: StoreSettings; message: string }> =>
    api.put('/settings', data).then(res => res.data),
};

// Cart API
export const cartAPI = {
  getCart: (sessionId: string): Promise<Cart> =>
    api.get(`/cart/${sessionId}`).then(res => res.data.data),

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
    api.post('/orders', data).then(res => res.data.data),

  getOrders: (params?: PaginationParams & { status?: string; search?: string; dateFilter?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<Order>> =>
    api.get('/orders', { params }).then(res => res.data),

  getOrder: (id: string): Promise<Order> =>
    api.get(`/orders/${id}`).then(res => res.data.data),

  updateOrderStatus: (id: string, status: string): Promise<Order> =>
    api.put(`/orders/${id}/status`, { status }).then(res => res.data.data),

  getOrderStats: (): Promise<OrderStats> =>
    api.get('/orders/stats').then(res => res.data.data),
};

// Audit Logs API
export const auditLogsAPI = {
  getAuditLogs: (params?: PaginationParams & { action?: string; resource?: string; userId?: string; search?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<any>> =>
    api.get('/audit-logs', { params }).then(res => res.data),

  getAuditLogStats: (): Promise<any> =>
    api.get('/audit-logs/stats').then(res => res.data.data),
};

export default api;