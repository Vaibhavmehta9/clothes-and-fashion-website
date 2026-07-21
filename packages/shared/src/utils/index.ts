// =====================================================
// STYLEVERSE – SHARED UTILITIES
// =====================================================

/**
 * Format price to Indian currency format
 */
export const formatPrice = (amount: number, currency = '₹'): string => {
  return `${currency}${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

/**
 * Calculate discount percentage
 */
export const calcDiscountPercent = (mrp: number, price: number): number => {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

/**
 * Generate URL-friendly slug from string
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Generate unique SKU for product variant
 */
export const generateSKU = (
  brandCode: string,
  categoryCode: string,
  productId: string,
  variantIndex: number
): string => {
  const brand = brandCode.slice(0, 3).toUpperCase();
  const cat = categoryCode.slice(0, 3).toUpperCase();
  const prod = productId.slice(-4).toUpperCase();
  return `${brand}-${cat}-${prod}-${variantIndex.toString().padStart(2, '0')}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Generate order number
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SV-${timestamp}-${random}`;
};

/**
 * Calculate read time for blog posts (words per minute)
 */
export const calcReadTime = (content: string, wpm = 200): number => {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wpm);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const timeAgo = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];

  for (const [secs, unit] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date, locale = 'en-IN'): string => {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Validate Indian PIN code
 */
export const isValidPincode = (pincode: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pincode);
};

/**
 * Validate Indian phone number
 */
export const isValidPhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
};

/**
 * Validate GST number
 */
export const isValidGST = (gst: string): boolean => {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
};

/**
 * Get Cloudinary image URL with transformations
 */
export const getCloudinaryUrl = (
  publicId: string,
  options: { width?: number; height?: number; quality?: number; format?: string } = {}
): string => {
  const { width = 'auto', height = 'auto', quality = 'auto', format = 'webp' } = options;
  const transforms = `w_${width},h_${height},q_${quality},f_${format},c_fill`;
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload/${transforms}/${publicId}`;
};

/**
 * Paginate an array
 */
export const paginateArray = <T>(
  array: T[],
  page: number,
  limit: number
): { data: T[]; total: number; pages: number } => {
  const total = array.length;
  const pages = Math.ceil(total / limit);
  const data = array.slice((page - 1) * limit, page * limit);
  return { data, total, pages };
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Capitalize first letter of each word
 */
export const titleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
};

/**
 * Remove HTML tags from string
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};
