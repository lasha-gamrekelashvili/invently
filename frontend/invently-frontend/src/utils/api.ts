import axios from 'axios';
import type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
  Category,
  Product,
  CreateCategoryData,
  CreateProductData,
  PaginatedResponse,
  PaginationParams
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Function to get the current subdomain
const getCurrentSubdomain = () => {
  const hostname = window.location.hostname;
  
  // For localhost development, check if it's a subdomain
  if (hostname.includes('localhost')) {
    const localhostParts = hostname.split('.');
    if (localhostParts.length > 1 && localhostParts[0] !== 'localhost') {
      return localhostParts[0];
    }
  } else {
    // For production, subdomain is the first part
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
  }
  
  return null;
};

// Function to check if we're on a subdomain
export const isOnSubdomain = () => {
  const host = window.location.hostname; // furniture.localhost OR furniture.shop.ge
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  // localhost special-case: foo.localhost is treated as subdomain
  if (host.endsWith('.localhost')) return true;
  // real domains: at least 3 labels = subdomain
  return host.split('.').length >= 3;
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
  list: (params?: PaginationParams & { categoryId?: string; status?: string }): Promise<PaginatedResponse<Product>> =>
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

  getProducts: (params?: PaginationParams & { categoryId?: string; search?: string }): Promise<PaginatedResponse<Product>> =>
    api.get('/storefront/products', { params }).then(res => res.data),

  getProduct: (slug: string): Promise<Product> =>
    api.get(`/storefront/products/${slug}`).then(res => res.data),

  getProductsByCategory: (categorySlug: string, params?: PaginationParams): Promise<{ category: Category; products: Product[]; pagination: any }> =>
    api.get(`/storefront/categories/${categorySlug}/products`, { params }).then(res => res.data),
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

export default api;