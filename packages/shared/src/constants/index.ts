// =====================================================
// STYLEVERSE – SHARED CONSTANTS
// =====================================================

export const CATEGORIES = [
  { name: 'Men', slug: 'men', icon: '👔' },
  { name: 'Women', slug: 'women', icon: '👗' },
  { name: 'Kids', slug: 'kids', icon: '👶' },
  { name: 'Footwear', slug: 'footwear', icon: '👟' },
  { name: 'Accessories', slug: 'accessories', icon: '👜' },
  { name: 'Ethnic Wear', slug: 'ethnic-wear', icon: '🪔' },
  { name: 'Western Wear', slug: 'western-wear', icon: '🧥' },
  { name: 'Sports Wear', slug: 'sports-wear', icon: '🏃' },
  { name: 'Winter Collection', slug: 'winter-collection', icon: '❄️' },
  { name: 'Summer Collection', slug: 'summer-collection', icon: '☀️' },
  { name: 'Formal Wear', slug: 'formal-wear', icon: '💼' },
  { name: 'Casual Wear', slug: 'casual-wear', icon: '👕' },
  { name: 'Luxury Collection', slug: 'luxury-collection', icon: '💎' },
  { name: 'Street Wear', slug: 'street-wear', icon: '🧢' },
  { name: 'Watches', slug: 'watches', icon: '⌚' },
  { name: 'Bags', slug: 'bags', icon: '👝' },
  { name: 'Jewellery', slug: 'jewellery', icon: '💍' },
  { name: 'Beauty', slug: 'beauty', icon: '💄' },
  { name: 'Perfume', slug: 'perfume', icon: '🌸' },
] as const;

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;

export const SHOE_SIZES = ['6', '7', '8', '9', '10', '11', '12'] as const;

export const COLORS = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#FFFFFF' },
  { name: 'Navy Blue', code: '#001F5B' },
  { name: 'Royal Blue', code: '#4169E1' },
  { name: 'Red', code: '#DC143C' },
  { name: 'Green', code: '#228B22' },
  { name: 'Brown', code: '#8B4513' },
  { name: 'Gray', code: '#808080' },
  { name: 'Pink', code: '#FF69B4' },
  { name: 'Yellow', code: '#FFD700' },
  { name: 'Orange', code: '#FF8C00' },
  { name: 'Purple', code: '#800080' },
  { name: 'Beige', code: '#F5F5DC' },
  { name: 'Maroon', code: '#800000' },
  { name: 'Olive', code: '#808000' },
  { name: 'Teal', code: '#008080' },
] as const;

export const MATERIALS = [
  'Cotton',
  'Linen',
  'Denim',
  'Silk',
  'Leather',
  'Polyester',
  'Wool',
  'Rayon',
  'Nylon',
  'Spandex',
  'Velvet',
  'Chiffon',
  'Georgette',
] as const;

export const FIT_TYPES = ['Slim Fit', 'Regular Fit', 'Oversized', 'Relaxed', 'Straight'] as const;

export const PATTERNS = ['Solid', 'Printed', 'Striped', 'Checked', 'Floral', 'Abstract', 'Embroidered'] as const;

export const SLEEVES = ['Half Sleeve', 'Full Sleeve', 'Sleeveless', 'Three Quarter'] as const;

export const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Best Discount', value: 'discount' },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  confirmed: 'blue',
  processing: 'indigo',
  shipped: 'purple',
  out_for_delivery: 'orange',
  delivered: 'green',
  cancelled: 'red',
  returned: 'gray',
  refunded: 'teal',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

export const BRANDS = [
  { name: 'Nike', slug: 'nike' },
  { name: "Levi's", slug: 'levis' },
  { name: 'H&M', slug: 'hm' },
  { name: 'Zara', slug: 'zara' },
  { name: 'Puma', slug: 'puma' },
  { name: 'Allen Solly', slug: 'allen-solly' },
  { name: 'US Polo', slug: 'us-polo' },
  { name: 'Adidas', slug: 'adidas' },
  { name: 'Tommy Hilfiger', slug: 'tommy-hilfiger' },
  { name: 'Roadster', slug: 'roadster' },
  { name: 'ONLY', slug: 'only' },
  { name: 'BIBA', slug: 'biba' },
  { name: 'Libas', slug: 'libas' },
  { name: 'Fossil', slug: 'fossil' },
  { name: 'Titan', slug: 'titan' },
  { name: 'Wildcraft', slug: 'wildcraft' },
  { name: 'Skybags', slug: 'skybags' },
  { name: 'W', slug: 'w-brand' },
  { name: 'FabIndia', slug: 'fabindia' },
  { name: 'Peter England', slug: 'peter-england' },
] as const;

export const APP_CONFIG = {
  name: 'StyleVerse',
  tagline: 'Wear Your World',
  currency: 'INR',
  currencySymbol: '₹',
  defaultCommission: 10,
  freeShippingThreshold: 999,
  defaultShippingFee: 99,
  defaultTax: 18,
  supportEmail: 'support@styleverse.com',
  maxImagesPerProduct: 8,
  maxCartItems: 50,
  reviewsPerPage: 10,
  productsPerPage: 24,
  ordersPerPage: 10,
} as const;
