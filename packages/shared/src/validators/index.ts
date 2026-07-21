// =====================================================
// STYLEVERSE – ZOD VALIDATORS
// Shared validation schemas for all entities
// =====================================================
import { z } from 'zod';

// ---- AUTH ----

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  role: z.enum(['customer', 'vendor']).default('customer'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ---- ADDRESS ----

export const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid PIN code'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

// ---- VENDOR ----

export const vendorRegisterSchema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters').max(100),
  storeDescription: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  businessEmail: z.string().email('Invalid business email'),
  businessPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number')
    .optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number').optional(),
  bankDetails: z.object({
    accountName: z.string().min(2, 'Account name is required'),
    accountNumber: z.string().min(9).max(18, 'Invalid account number'),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
    bankName: z.string().min(3, 'Bank name is required'),
  }),
  address: addressSchema,
});

// ---- PRODUCT ----

export const productVariantSchema = z.object({
  color: z.string().optional(),
  colorCode: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  fit: z.string().optional(),
  pattern: z.string().optional(),
  sleeve: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  mrp: z.number().positive('MRP must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  images: z.array(z.string().url()).min(1, 'At least 1 image required'),
});

export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  shortDescription: z.string().max(200).optional(),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).min(1, 'At least 1 tag is required'),
  variants: z.array(productVariantSchema).min(1, 'At least 1 variant is required'),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  saleEndsAt: z.string().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

// ---- REVIEW ----

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10, 'Review must be at least 10 characters').max(2000),
  images: z.array(z.string().url()).max(5).optional(),
});

// ---- QUESTION ----

export const questionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters').max(500),
});

export const answerSchema = z.object({
  answer: z.string().min(5, 'Answer must be at least 5 characters').max(1000),
});

// ---- COUPON ----

export const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().default(100),
  isActive: z.boolean().default(true),
  expiresAt: z.string().min(1, 'Expiry date is required'),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
});

// ---- ORDER ----

export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.enum(['cod', 'razorpay', 'stripe', 'wallet', 'upi']),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// ---- SUPPORT TICKET ----

export const supportTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  orderId: z.string().optional(),
});

// ---- CMS ----

export const cmsPageSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200),
  content: z.string().min(10),
  isActive: z.boolean().default(true),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

export const bannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().optional(),
  image: z.string().url('Valid image URL required'),
  mobileImage: z.string().url().optional(),
  link: z.string().optional(),
  buttonText: z.string().optional(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ---- BLOG ----

export const blogSchema = z.object({
  title: z.string().min(5).max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  coverImage: z.string().url().optional(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

// ---- NEWSLETTER ----

export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ---- CATEGORY ----

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  parent: z.string().optional(),
  isActive: z.boolean().default(true),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

// ---- BRAND ----

export const brandSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

// ---- SETTINGS ----

export const settingsSchema = z.object({
  siteName: z.string().min(2).max(100),
  siteTagline: z.string().max(200),
  currency: z.string().default('INR'),
  currencySymbol: z.string().default('₹'),
  tax: z.number().min(0).max(100).default(18),
  shippingFee: z.number().min(0).default(99),
  freeShippingThreshold: z.number().min(0).default(999),
  defaultCommissionRate: z.number().min(0).max(100).default(10),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  address: z.string(),
  maintenanceMode: z.boolean().default(false),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
export type CMSPageInput = z.infer<typeof cmsPageSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
