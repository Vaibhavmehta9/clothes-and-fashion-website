// =====================================================
// STYLEVERSE – SHARED TYPES
// All TypeScript interfaces shared between apps
// =====================================================

// ---- ENUMS ----

export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

export enum VendorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  COD = 'cod',
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  WALLET = 'wallet',
  UPI = 'upi',
}

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_SHIPPING = 'free_shipping',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum NotificationType {
  ORDER = 'order',
  PRODUCT = 'product',
  REVIEW = 'review',
  SYSTEM = 'system',
  PROMO = 'promo',
  VENDOR = 'vendor',
}

// ---- INTERFACES ----

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IAddress {
  _id: string;
  user: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface IVendor {
  _id: string;
  user: IUser | string;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  storeBanner?: string;
  storeDescription: string;
  businessEmail: string;
  businessPhone: string;
  gstNumber?: string;
  panNumber?: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  address: IAddress;
  status: VendorStatus;
  commissionRate: number;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: ICategory | string | null;
  children?: ICategory[];
  level: number;
  isActive: boolean;
  productCount: number;
  seo: ISEOMeta;
  createdAt: string;
  updatedAt: string;
}

export interface IBrand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  isFeatured: boolean;
  productCount: number;
  seo: ISEOMeta;
  createdAt: string;
  updatedAt: string;
}

export interface IProductVariant {
  _id: string;
  product: string;
  color?: string;
  colorCode?: string;
  size?: string;
  material?: string;
  fit?: string;
  pattern?: string;
  sleeve?: string;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  sku: string;
  images: string[];
  isActive: boolean;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: IBrand | string;
  category: ICategory | string;
  vendor: IVendor | string;
  images: string[];
  thumbnail: string;
  variants: IProductVariant[];
  basePrice: number;
  baseMrp: number;
  baseDiscount: number;
  tags: string[];
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  wishlistCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  saleEndsAt?: string;
  seo: ISEOMeta;
  createdAt: string;
  updatedAt: string;
}

export interface ISEOMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface ICartItem {
  _id: string;
  product: IProduct | string;
  variant: IProductVariant | string;
  quantity: number;
  price: number;
  mrp: number;
}

export interface ICart {
  _id: string;
  user: string;
  items: ICartItem[];
  coupon?: ICoupon | string;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  updatedAt: string;
}

export interface IOrderItem {
  _id: string;
  product: IProduct | string;
  variant: IProductVariant | string;
  vendor: IVendor | string;
  name: string;
  thumbnail: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  mrp: number;
  discount: number;
  total: number;
  status: OrderStatus;
  trackingNumber?: string;
  returnRequested: boolean;
  returnReason?: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: IUser | string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingFee: number;
  tax: number;
  total: number;
  coupon?: ICoupon | string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  status: OrderStatus;
  estimatedDelivery?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  vendor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IReview {
  _id: string;
  product: IProduct | string;
  user: IUser | string;
  order?: string;
  rating: number;
  title?: string;
  body: string;
  images?: string[];
  status: ReviewStatus;
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IQuestion {
  _id: string;
  product: IProduct | string;
  user: IUser | string;
  question: string;
  answers: IAnswer[];
  isAnswered: boolean;
  createdAt: string;
}

export interface IAnswer {
  _id: string;
  question: string;
  user: IUser | string;
  isVendor: boolean;
  answer: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  user: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  image?: string;
  createdAt: string;
}

export interface IBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  author: IUser | string;
  categories: string[];
  tags: string[];
  status: 'draft' | 'published';
  readTime: number;
  viewCount: number;
  seo: ISEOMeta;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBanner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  buttonText?: string;
  position: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICMSPage {
  _id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  seo: ISEOMeta;
  createdAt: string;
  updatedAt: string;
}

export interface ISettings {
  _id: string;
  siteName: string;
  siteTagline: string;
  logo: string;
  favicon: string;
  currency: string;
  currencySymbol: string;
  tax: number;
  shippingFee: number;
  freeShippingThreshold: number;
  defaultCommissionRate: number;
  maintenanceMode: boolean;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    pinterest?: string;
  };
}

export interface ISupportTicket {
  _id: string;
  user: IUser | string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  messages: {
    sender: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ---- API RESPONSE TYPES ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

// ---- FILTER / QUERY TYPES ----

export interface ProductFilters {
  category?: string;
  brand?: string;
  vendor?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  colors?: string[];
  sizes?: string[];
  materials?: string[];
  isOnSale?: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface VendorAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  avgOrderValue: number;
  revenueByMonth: { month: string; revenue: number }[];
  topProducts: { product: IProduct; sales: number; revenue: number }[];
  ordersByStatus: Record<OrderStatus, number>;
}

export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalVendors: number;
  pendingVendors: number;
  pendingProducts: number;
  revenueByMonth: { month: string; revenue: number; commission: number }[];
  topVendors: { vendor: IVendor; revenue: number; orders: number }[];
  topCategories: { category: ICategory; sales: number }[];
  topProducts: { product: IProduct; sales: number }[];
  ordersByStatus: Record<OrderStatus, number>;
}
