export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PLATFORM_ADMIN' | 'STORE_OWNER';
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
  products?: Product[];
  allProducts?: Product[];
  _count?: {
    products: number;
  };
  _recursiveCount?: number;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  slug: string;
  price: number;
  stockQuantity: number;
  status: 'ACTIVE' | 'DRAFT' | 'DELETED';
  tenantId: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  filename: string;
  productId: string;
  tenantId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tenants?: Tenant[];
  tenant?: Tenant;
  token: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  products?: T[];
  categories?: T[];
  tenants?: T[];
  users?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface CreateProductData {
  title: string;
  description?: string;
  slug: string;
  price: number;
  stockQuantity: number;
  status: 'ACTIVE' | 'DRAFT';
  categoryId?: string;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  subdomain: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export interface Cart {
  id: string;
  sessionId: string;
  tenantId: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  tenantId: string;
  customerEmail: string;
  customerName: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  shippingAddress?: any;
  billingAddress?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  title: string;
  createdAt: string;
  product: Product;
}

export interface OrderStats {
  totalOrders: number;
  monthlyOrders: number;
  weeklyOrders: number;
  monthlyRevenue: number;
  recentOrders: Order[];
  ordersByStatus: Array<{
    status: string;
    _count: { status: number };
  }>;
}

export interface CreateOrderData {
  sessionId: string;
  customerEmail: string;
  customerName: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  tenantId?: string;
  oldData?: any;
  newData?: any;
  createdAt: string;
  anonymousUserEmail?: string;
  anonymousUserName?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}