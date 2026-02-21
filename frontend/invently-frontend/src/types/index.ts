export interface User {
  id: string;
  email: string;
  role: 'PLATFORM_ADMIN' | 'STORE_OWNER';
  iban?: string;
  emailVerified?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  tenantId: string;
  isActive: boolean;
  isDeleted: boolean; // Soft deletion flag
  deletedAt?: string;
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

export interface ProductVariant {
  id: string;
  productId: string;
  sku?: string;
  options: Record<string, string>; // e.g., { "size": "M", "color": "Red" }
  price?: number; // Overrides product base price if set
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  slug: string;
  sku?: string; // Stock Keeping Unit
  price: number; // Base price (can be overridden by variants)
  stockQuantity: number; // Base stock (can be overridden by variants)
  isActive: boolean; // true = visible in storefront, false = draft/hidden
  isDeleted: boolean; // Soft deletion flag
  deletedAt?: string;
  tenantId: string;
  categoryId?: string;
  attributes?: Record<string, any>; // Custom product attributes e.g., { "material": "Cotton", "brand": "Nike" }
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images?: ProductImage[];
  variants?: ProductVariant[];
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
  payment?: Payment;
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
  sku?: string;
  price: number;
  stockQuantity: number;
  isActive?: boolean; // true = visible in storefront, false = draft/hidden
  categoryId?: string;
  attributes?: Record<string, any>;
  variants?: Array<{
    sku?: string;
    options: Record<string, string>;
    price?: number;
    stockQuantity?: number;
    isActive?: boolean;
  }>;
}

export interface CreateVariantData {
  sku?: string;
  options: Record<string, string>;
  price?: number;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface UpdateVariantData {
  sku?: string;
  options?: Record<string, string>;
  price?: number;
  stockQuantity?: number;
  isActive?: boolean;
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
  tenantName: string;
  subdomain: string;
}

export interface Payment {
  id: string;
  userId: string;
  tenantId: string;
  type: 'SETUP_FEE' | 'MONTHLY_SUBSCRIPTION';
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  transactionId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export interface Subscription {
  id: string;
  tenantId: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    isActive: boolean;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
  variant?: ProductVariant;
  isAvailable?: boolean; // false if product is deleted, inactive, or out of stock
  unavailableReason?: string; // reason why item is unavailable
  availableStock?: number; // current stock available
  hasEnoughStock?: boolean; // true if stock >= quantity in cart
  isOutOfStock?: boolean; // true if stock is 0
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
  hasUnavailableItems?: boolean; // true if cart has deleted/inactive/out of stock items
  unavailableCount?: number; // count of unavailable items
  hasStockIssues?: boolean; // true if any items have stock problems
  stockIssueCount?: number; // count of items with stock issues
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
  variantId?: string;
  quantity: number;
  price: number;
  title: string;
  variantData?: Record<string, string>; // Snapshot of variant options at time of order
  createdAt: string;
  product: Product;
  variant?: ProductVariant;
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

// Georgian address format
export interface GeorgianAddress {
  region: string;
  regionName?: string | { en: string; ka: string };
  district: string;
  districtName?: string | { en: string; ka: string };
  address: string;
  notes?: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
}

// Legacy address format
export interface LegacyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type ShippingAddress = GeorgianAddress | LegacyAddress;

export interface CreateOrderData {
  sessionId: string;
  customerEmail: string;
  customerName: string;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  notes?: string;
  returnOrigin?: string;
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

export interface StoreSettings {
  id: string;
  tenantId: string;
  /** Included from tenant when fetched via GET /api/settings */
  subdomain: string;
  customDomain?: string | null;
  aboutUs?: {
    title: string;
    content: string;
  };
  contact?: {
    title: string;
    content: string;
  };
  privacyPolicy?: {
    title: string;
    content: string;
  };
  termsOfService?: {
    title: string;
    content: string;
  };
  shippingInfo?: {
    title: string;
    content: string;
  };
  returns?: {
    title: string;
    content: string;
  };
  faq?: {
    title: string;
    content: string;
  };
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  trackOrderUrl?: string;
  backgroundColor?: string;
  sidebarBackgroundColor?: string;
  sidebarSelectedColor?: string;
  sidebarHoverColor?: string;
  cardInfoBackgroundColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  headerBorderColor?: string;
  searchBarBackgroundColor?: string;
  searchBarBorderColor?: string;
  searchBarTextColor?: string;
  searchBarPlaceholderColor?: string;
  searchBarIconColor?: string;
  sidebarTextColor?: string;
  sidebarSelectedTextColor?: string;
  sidebarHeadingColor?: string;
  sidebarDividerColor?: string;
  sidebarBorderColor?: string;
  productCardBorderColor?: string;
  productCardHoverBorderColor?: string;
  productCardTextColor?: string;
  productCardCategoryTextColor?: string;
  productCardPriceTextColor?: string;
  buttonPrimaryBackgroundColor?: string;
  buttonPrimaryTextColor?: string;
  buttonSecondaryBackgroundColor?: string;
  buttonSecondaryTextColor?: string;
  buttonSecondaryBorderColor?: string;
  linkColor?: string;
  linkHoverColor?: string;
  footerBackgroundColor?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerLinkColor?: string;
  categorySectionTitleColor?: string;
  categorySectionAccentColor?: string;
  categorySectionLinkColor?: string;
  categorySectionLinkHoverColor?: string;
  categorySectionBorderColor?: string;
  breadcrumbTextColor?: string;
  breadcrumbActiveTextColor?: string;
  breadcrumbHoverColor?: string;
  breadcrumbIconColor?: string;
  productDetailCardBackgroundColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStoreSettingsData {
  aboutUs?: {
    title: string;
    content: string;
  };
  contact?: {
    title: string;
    content: string;
  };
  privacyPolicy?: {
    title: string;
    content: string;
  };
  termsOfService?: {
    title: string;
    content: string;
  };
  shippingInfo?: {
    title: string;
    content: string;
  };
  returns?: {
    title: string;
    content: string;
  };
  faq?: {
    title: string;
    content: string;
  };
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  trackOrderUrl?: string;
  backgroundColor?: string;
  sidebarBackgroundColor?: string;
  sidebarSelectedColor?: string;
  sidebarHoverColor?: string;
  cardInfoBackgroundColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  headerBorderColor?: string;
  searchBarBackgroundColor?: string;
  searchBarBorderColor?: string;
  searchBarTextColor?: string;
  searchBarPlaceholderColor?: string;
  searchBarIconColor?: string;
  sidebarTextColor?: string;
  sidebarSelectedTextColor?: string;
  sidebarHeadingColor?: string;
  sidebarDividerColor?: string;
  sidebarBorderColor?: string;
  productCardBorderColor?: string;
  productCardHoverBorderColor?: string;
  productCardTextColor?: string;
  productCardCategoryTextColor?: string;
  productCardPriceTextColor?: string;
  buttonPrimaryBackgroundColor?: string;
  buttonPrimaryTextColor?: string;
  buttonSecondaryBackgroundColor?: string;
  buttonSecondaryTextColor?: string;
  buttonSecondaryBorderColor?: string;
  linkColor?: string;
  linkHoverColor?: string;
  footerBackgroundColor?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerLinkColor?: string;
  categorySectionTitleColor?: string;
  categorySectionAccentColor?: string;
  categorySectionLinkColor?: string;
  categorySectionLinkHoverColor?: string;
  categorySectionBorderColor?: string;
  breadcrumbTextColor?: string;
  breadcrumbActiveTextColor?: string;
  breadcrumbHoverColor?: string;
  breadcrumbIconColor?: string;
  productDetailCardBackgroundColor?: string;
}