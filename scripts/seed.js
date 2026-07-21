const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
// ============================================================
// STYLEVERSE – COMPREHENSIVE DATABASE SEED SCRIPT
// 50 products, 10 categories, 15 brands, 5 vendors,
// 20 customers, 30 orders, coupons, reviews, blogs, Q&A
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styleverse';
// ---- INLINE SCHEMAS (to avoid import complexity in scripts) ----
// ... [We use raw mongoose models with schemas defined inline for seeder independence]
const userSchema = new mongoose.Schema({
    name: String, email: String, phone: String, avatar: String, password: String,
    role: { type: String, default: 'customer' }, isEmailVerified: Boolean, isActive: { type: Boolean, default: true },
    wishlist: [mongoose.Schema.Types.ObjectId], addresses: [mongoose.Schema.Types.ObjectId],
    refreshTokens: [String], lastLogin: Date,
}, { timestamps: true });
const vendorSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId, storeName: String, storeSlug: String,
    storeLogo: String, storeBanner: String, storeDescription: String,
    businessEmail: String, businessPhone: String, gstNumber: String,
    bankDetails: { accountName: String, accountNumber: String, ifscCode: String, bankName: String },
    address: { addressLine1: String, city: String, state: String, pincode: String, country: { type: String, default: 'India' } },
    status: { type: String, default: 'approved' }, commissionRate: { type: Number, default: 10 },
    totalSales: { type: Number, default: 0 }, totalRevenue: { type: Number, default: 0 },
    rating: { type: Number, default: 4.2 }, reviewCount: { type: Number, default: 0 }, isVerified: { type: Boolean, default: true },
}, { timestamps: true });
const categorySchema = new mongoose.Schema({
    name: String, slug: String, description: String, image: String, icon: String,
    parent: { type: mongoose.Schema.Types.ObjectId, default: null }, level: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }, productCount: { type: Number, default: 0 },
    seo: { title: String, description: String },
}, { timestamps: true });
const brandSchema = new mongoose.Schema({
    name: String, slug: String, logo: String, banner: String, description: String,
    isActive: { type: Boolean, default: true }, isFeatured: { type: Boolean, default: false },
    productCount: { type: Number, default: 0 },
}, { timestamps: true });
const productVariantSchema = new mongoose.Schema({
    product: mongoose.Schema.Types.ObjectId, color: String, colorCode: String, size: String,
    material: String, fit: String, pattern: String, sleeve: String,
    price: Number, mrp: Number, discount: Number, stock: Number, sku: String,
    images: [String], isActive: { type: Boolean, default: true },
}, { timestamps: true });
const productSchema = new mongoose.Schema({
    name: String, slug: String, description: String, shortDescription: String,
    brand: mongoose.Schema.Types.ObjectId, category: mongoose.Schema.Types.ObjectId, vendor: mongoose.Schema.Types.ObjectId,
    images: [String], thumbnail: String, variants: [mongoose.Schema.Types.ObjectId],
    basePrice: Number, baseMrp: Number, baseDiscount: Number, tags: [String],
    status: { type: String, default: 'active' }, rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }, wishlistCount: { type: Number, default: 0 },
    isFeatured: Boolean, isNewArrival: Boolean, isTrending: Boolean, isBestSeller: Boolean,
    isOnSale: Boolean, viewCount: { type: Number, default: 0 },
    seo: { title: String, description: String, keywords: [String] },
}, { timestamps: true });
const addressSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId, name: String, phone: String,
    addressLine1: String, city: String, state: String, pincode: String,
    country: { type: String, default: 'India' }, isDefault: Boolean,
}, { timestamps: true });
const cartSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    items: [{
            product: mongoose.Schema.Types.ObjectId, variant: mongoose.Schema.Types.ObjectId,
            quantity: Number, price: Number, mrp: Number,
        }],
    subtotal: Number, discount: Number, couponDiscount: Number, shippingFee: Number, total: Number,
}, { timestamps: true });
const orderSchema = new mongoose.Schema({
    orderNumber: String, invoiceNumber: String,
    user: mongoose.Schema.Types.ObjectId,
    items: [{
            product: mongoose.Schema.Types.ObjectId, variant: mongoose.Schema.Types.ObjectId,
            vendor: mongoose.Schema.Types.ObjectId, name: String, thumbnail: String,
            color: String, size: String, quantity: Number, price: Number, mrp: Number,
            discount: Number, total: Number, status: { type: String, default: 'delivered' },
            returnRequested: { type: Boolean, default: false },
        }],
    shippingAddress: { name: String, phone: String, addressLine1: String, city: String, state: String, pincode: String, country: String },
    subtotal: Number, discount: Number, couponDiscount: Number, shippingFee: Number, tax: Number, total: Number,
    paymentMethod: String, paymentStatus: String, status: String,
    estimatedDelivery: Date, deliveredAt: Date,
}, { timestamps: true });
const reviewSchema = new mongoose.Schema({
    product: mongoose.Schema.Types.ObjectId, user: mongoose.Schema.Types.ObjectId, order: mongoose.Schema.Types.ObjectId,
    rating: Number, title: String, body: String, images: [String],
    status: { type: String, default: 'approved' }, helpfulCount: Number, isVerifiedPurchase: Boolean,
}, { timestamps: true });
const couponSchema = new mongoose.Schema({
    code: String, description: String, type: String, value: Number,
    minOrderAmount: Number, maxDiscount: Number, usageLimit: Number, usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }, expiresAt: Date, createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });
const blogSchema = new mongoose.Schema({
    title: String, slug: String, excerpt: String, content: String, coverImage: String,
    author: mongoose.Schema.Types.ObjectId, categories: [String], tags: [String],
    status: { type: String, default: 'published' }, readTime: Number, viewCount: { type: Number, default: 0 },
    publishedAt: Date,
}, { timestamps: true });
const bannerSchema = new mongoose.Schema({
    title: String, subtitle: String, image: String, mobileImage: String,
    link: String, buttonText: String, position: Number, isActive: { type: Boolean, default: true },
}, { timestamps: true });
const cmsPageSchema = new mongoose.Schema({
    title: String, slug: String, content: String, isActive: { type: Boolean, default: true },
    seo: { title: String, description: String },
}, { timestamps: true });
const settingsSchema = new mongoose.Schema({
    siteName: String, siteTagline: String, logo: String, favicon: String,
    currency: String, currencySymbol: String, tax: Number, shippingFee: Number,
    freeShippingThreshold: Number, defaultCommissionRate: Number, maintenanceMode: Boolean,
    contactEmail: String, contactPhone: String, address: String,
    socialLinks: { facebook: String, instagram: String, twitter: String },
    paymentMethods: { cod: Boolean, razorpay: Boolean, upi: Boolean },
}, { timestamps: true });
const notificationSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId, title: String, body: String, type: String,
    isRead: { type: Boolean, default: false }, link: String,
}, { timestamps: true });
const newsletterSchema = new mongoose.Schema({
    email: String, isActive: { type: Boolean, default: true }, subscribedAt: Date,
}, { timestamps: true });
// ---- MODELS ----
const User = mongoose.model('User', userSchema);
const Vendor = mongoose.model('Vendor', vendorSchema);
const Category = mongoose.model('Category', categorySchema);
const Brand = mongoose.model('Brand', brandSchema);
const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
const Product = mongoose.model('Product', productSchema);
const Address = mongoose.model('Address', addressSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Blog = mongoose.model('Blog', blogSchema);
const Banner = mongoose.model('Banner', bannerSchema);
const CMSPage = mongoose.model('CMSPage', cmsPageSchema);
const Settings = mongoose.model('Settings', settingsSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Newsletter = mongoose.model('Newsletter', newsletterSchema);
// ============================================================
// SEED DATA
// ============================================================
const CLOUDINARY_BASE = 'https://images.unsplash.com'; // Using Unsplash for realistic demo images
const PRODUCT_IMAGES = {
    tshirt: [
        `${CLOUDINARY_BASE}/photo-1521572163474-6864f9cf17ab?w=800`,
        `${CLOUDINARY_BASE}/photo-1503342217505-b0a15ec3261c?w=800`,
        `${CLOUDINARY_BASE}/photo-1562157873-818bc0726f68?w=800`,
        `${CLOUDINARY_BASE}/photo-1503341455253-b2e723bb3dbb?w=800`,
    ],
    jeans: [
        `${CLOUDINARY_BASE}/photo-1542272604-787c3835535d?w=800`,
        `${CLOUDINARY_BASE}/photo-1541099649105-f69ad21f3246?w=800`,
        `${CLOUDINARY_BASE}/photo-1475178626620-a4d074967452?w=800`,
    ],
    shoes: [
        `${CLOUDINARY_BASE}/photo-1542291026-7eec264c27ff?w=800`,
        `${CLOUDINARY_BASE}/photo-1606107557195-0e29a4b5b4aa?w=800`,
        `${CLOUDINARY_BASE}/photo-1608231387042-66d1773070a5?w=800`,
        `${CLOUDINARY_BASE}/photo-1491553895911-0055eca6402d?w=800`,
    ],
    dress: [
        `${CLOUDINARY_BASE}/photo-1496747611176-843222e1e57c?w=800`,
        `${CLOUDINARY_BASE}/photo-1515886657613-9f3515b0c78f?w=800`,
        `${CLOUDINARY_BASE}/photo-1572804013309-59a88b7e92f1?w=800`,
    ],
    jacket: [
        `${CLOUDINARY_BASE}/photo-1551028719-00167b16eac5?w=800`,
        `${CLOUDINARY_BASE}/photo-1591047139829-d91aecb6caea?w=800`,
        `${CLOUDINARY_BASE}/photo-1551488831-00ddcb6c6bd3?w=800`,
        `${CLOUDINARY_BASE}/photo-1544923246-77307dd654cb?w=800`,
        `${CLOUDINARY_BASE}/photo-1548883354-7622d03aca27?w=800`,
    ],
    saree: [
        `${CLOUDINARY_BASE}/photo-1610030469983-98e550d6193c?w=800`,
        `${CLOUDINARY_BASE}/photo-1617627143233-4df547d06a15?w=800`,
    ],
    watch: [
        `${CLOUDINARY_BASE}/photo-1524592094714-0f0654e20314?w=800`,
        `${CLOUDINARY_BASE}/photo-1523170335258-f5ed11844a49?w=800`,
    ],
    bag: [
        `${CLOUDINARY_BASE}/photo-1548036328-c9fa89d128fa?w=800`,
        `${CLOUDINARY_BASE}/photo-1553062407-98eeb64c6a62?w=800`,
    ],
    hoodie: [
        `${CLOUDINARY_BASE}/photo-1620799140408-edc6dcb6d633?w=800`,
        `${CLOUDINARY_BASE}/photo-1556911220-e15b29be8c8f?w=800`,
    ],
    kurti: [
        `${CLOUDINARY_BASE}/photo-1608748010899-18f300247112?w=800`,
        `${CLOUDINARY_BASE}/photo-1631857455684-a54a2f03665f?w=800`,
    ],
};

const imageCounters = {};
function getUniqueImagesForCategory(type, count = 4) {
    const images = PRODUCT_IMAGES[type];
    if (!images) return [];
    if (imageCounters[type] === undefined) {
        imageCounters[type] = 0;
    }
    const startIndex = imageCounters[type];
    const selected = [];
    for (let i = 0; i < count; i++) {
        const idx = (startIndex + i) % images.length;
        selected.push(images[idx]);
    }
    imageCounters[type] = (startIndex + 1) % images.length;
    return selected;
}

function getImageType(category, name) {
    const lowerName = name.toLowerCase();
    if (category === 'footwear' || lowerName.includes('shoes') || lowerName.includes('sneakers')) {
        return 'shoes';
    }
    if (category === 'bags' || lowerName.includes('bag') || lowerName.includes('backpack') || lowerName.includes('duffel')) {
        return 'bag';
    }
    if (category === 'watches' || lowerName.includes('watch')) {
        return 'watch';
    }
    if (category === 'ethnic-wear') {
        if (lowerName.includes('saree')) return 'saree';
        return 'kurti';
    }
    if (lowerName.includes('saree')) return 'saree';
    if (lowerName.includes('kurti') || lowerName.includes('palazzo')) return 'kurti';
    if (lowerName.includes('dress') || lowerName.includes('skirt') || lowerName.includes('slip') || lowerName.includes('lehenga')) {
        return 'dress';
    }
    if (lowerName.includes('jacket') || lowerName.includes('coat') || lowerName.includes('blazer') || lowerName.includes('tracksuit') || lowerName.includes('overcoat')) {
        return 'jacket';
    }
    if (lowerName.includes('hoodie') || lowerName.includes('sweatshirt') || lowerName.includes('sweater')) {
        return 'hoodie';
    }
    if (lowerName.includes('jeans') || lowerName.includes('pants') || lowerName.includes('chinos') || lowerName.includes('shorts') || lowerName.includes('tights') || lowerName.includes('jogger')) {
        return 'jeans';
    }
    return 'tshirt';
}
const CATEGORY_DATA = [
    { name: 'Men', slug: 'men', icon: '👔', image: `${CLOUDINARY_BASE}/photo-1490578474895-699cd4e2cf59?w=400`, description: 'Explore the latest in men\'s fashion' },
    { name: 'Women', slug: 'women', icon: '👗', image: `${CLOUDINARY_BASE}/photo-1483985988355-763728e1935b?w=400`, description: 'Trendy fashion for modern women' },
    { name: 'Kids', slug: 'kids', icon: '👶', image: `${CLOUDINARY_BASE}/photo-1503944168849-8bf86875bbd8?w=400`, description: 'Fun and comfortable kids\' clothing' },
    { name: 'Footwear', slug: 'footwear', icon: '👟', image: `${CLOUDINARY_BASE}/photo-1542291026-7eec264c27ff?w=400`, description: 'Shoes for every occasion' },
    { name: 'Accessories', slug: 'accessories', icon: '👜', image: `${CLOUDINARY_BASE}/photo-1553062407-98eeb64c6a62?w=400`, description: 'Complete your look' },
    { name: 'Ethnic Wear', slug: 'ethnic-wear', icon: '🪔', image: `${CLOUDINARY_BASE}/photo-1617627143233-4df547d06a15?w=400`, description: 'Celebrate Indian heritage' },
    { name: 'Sports Wear', slug: 'sports-wear', icon: '🏃', image: `${CLOUDINARY_BASE}/photo-1517963879433-6ad2b056d712?w=400`, description: 'Performance activewear' },
    { name: 'Winter Collection', slug: 'winter-collection', icon: '❄️', image: `${CLOUDINARY_BASE}/photo-1548712604-f03d39b0d789?w=400`, description: 'Stay warm in style' },
    { name: 'Watches', slug: 'watches', icon: '⌚', image: `${CLOUDINARY_BASE}/photo-1524592094714-0f0654e20314?w=400`, description: 'Luxury & casual timepieces' },
    { name: 'Bags', slug: 'bags', icon: '🎒', image: `${CLOUDINARY_BASE}/photo-1548036328-c9fa89d128fa?w=400`, description: 'Backpacks, totes & more' },
];
const BRAND_DATA = [
    { name: 'Nike', slug: 'nike', logo: `${CLOUDINARY_BASE}/photo-1542291026-7eec264c27ff?w=200`, isFeatured: true, description: 'Just Do It – World\'s leading sportswear brand' },
    { name: "Levi's", slug: 'levis', logo: `${CLOUDINARY_BASE}/photo-1542272604-787c3835535d?w=200`, isFeatured: true, description: 'Iconic American denim brand since 1853' },
    { name: 'H&M', slug: 'hm', logo: `${CLOUDINARY_BASE}/photo-1521572163474-6864f9cf17ab?w=200`, isFeatured: true, description: 'Affordable fashion for everyone' },
    { name: 'Zara', slug: 'zara', logo: `${CLOUDINARY_BASE}/photo-1496747611176-843222e1e57c?w=200`, isFeatured: true, description: 'Fast fashion with European flair' },
    { name: 'Puma', slug: 'puma', logo: `${CLOUDINARY_BASE}/photo-1606107557195-0e29a4b5b4aa?w=200`, isFeatured: true, description: 'Sport & lifestyle brand' },
    { name: 'Allen Solly', slug: 'allen-solly', logo: `${CLOUDINARY_BASE}/photo-1503341455253-b2e723bb3dbb?w=200`, isFeatured: false, description: 'Corporate casual at its finest' },
    { name: 'US Polo', slug: 'us-polo', logo: `${CLOUDINARY_BASE}/photo-1583743814966-8936f5b7be1a?w=200`, isFeatured: false, description: 'American preppy style' },
    { name: 'Adidas', slug: 'adidas', logo: `${CLOUDINARY_BASE}/photo-1517963879433-6ad2b056d712?w=200`, isFeatured: true, description: 'Impossible is nothing' },
    { name: 'Tommy Hilfiger', slug: 'tommy-hilfiger', logo: `${CLOUDINARY_BASE}/photo-1503341455253-b2e723bb3dbb?w=200`, isFeatured: true, description: 'Classic American cool' },
    { name: 'Roadster', slug: 'roadster', logo: `${CLOUDINARY_BASE}/photo-1551028719-00167b16eac5?w=200`, isFeatured: false, description: 'Young, bold, edgy fashion' },
    { name: 'ONLY', slug: 'only', logo: `${CLOUDINARY_BASE}/photo-1515886657613-9f3515b0c78f?w=200`, isFeatured: false, description: 'Contemporary women\'s fashion' },
    { name: 'BIBA', slug: 'biba', logo: `${CLOUDINARY_BASE}/photo-1583391733981-8498408ee4b2?w=200`, isFeatured: false, description: 'Indian ethnic wear specialist' },
    { name: 'Fossil', slug: 'fossil', logo: `${CLOUDINARY_BASE}/photo-1524592094714-0f0654e20314?w=200`, isFeatured: true, description: 'American lifestyle brand' },
    { name: 'Titan', slug: 'titan', logo: `${CLOUDINARY_BASE}/photo-1523170335258-f5ed11844a49?w=200`, isFeatured: true, description: 'India\'s leading watch manufacturer' },
    { name: 'Wildcraft', slug: 'wildcraft', logo: `${CLOUDINARY_BASE}/photo-1553062407-98eeb64c6a62?w=200`, isFeatured: false, description: 'Outdoor & adventure gear' },
];
const COLORS = [
    { name: 'Black', code: '#000000' },
    { name: 'White', code: '#FFFFFF' },
    { name: 'Navy Blue', code: '#001F5B' },
    { name: 'Red', code: '#DC143C' },
    { name: 'Gray', code: '#808080' },
    { name: 'Olive', code: '#808000' },
    { name: 'Maroon', code: '#800000' },
];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['7', '8', '9', '10', '11'];
function generateSKU(prefix, idx) {
    return `SV-${prefix}-${String(idx).padStart(5, '0')}`;
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max) {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
async function seed() {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected.');
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
        User.deleteMany({}), Vendor.deleteMany({}), Category.deleteMany({}),
        Brand.deleteMany({}), ProductVariant.deleteMany({}), Product.deleteMany({}),
        Address.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({}),
        Review.deleteMany({}), Coupon.deleteMany({}), Blog.deleteMany({}),
        Banner.deleteMany({}), CMSPage.deleteMany({}), Settings.deleteMany({}),
        Notification.deleteMany({}), Newsletter.deleteMany({}),
    ]);
    console.log('👤 Creating users...');
    const passwordHash = await bcrypt.hash('StyleVerse@123', 12);
    // Admin + Support
    const admin = await User.create({
        name: 'Super Admin', email: 'admin@styleverse.com', password: passwordHash,
        role: 'admin', isEmailVerified: true, isActive: true,
        avatar: `${CLOUDINARY_BASE}/photo-1472099645785-5658abf4ff4e?w=200`,
    });
    await User.create({
        name: 'Support Staff', email: 'support@styleverse.com', password: passwordHash,
        role: 'support', isEmailVerified: true, isActive: true,
        avatar: `${CLOUDINARY_BASE}/photo-1494790108377-be9c29b29330?w=200`,
    });
    // Vendors (5)
    const vendorUsers = await User.create([
        { name: 'Rahul Sharma', email: 'vendor1@styleverse.com', password: passwordHash, role: 'vendor', isEmailVerified: true },
        { name: 'Priya Patel', email: 'vendor2@styleverse.com', password: passwordHash, role: 'vendor', isEmailVerified: true },
        { name: 'Arjun Mehta', email: 'vendor3@styleverse.com', password: passwordHash, role: 'vendor', isEmailVerified: true },
        { name: 'Kavya Nair', email: 'vendor4@styleverse.com', password: passwordHash, role: 'vendor', isEmailVerified: true },
        { name: 'Vikram Singh', email: 'vendor5@styleverse.com', password: passwordHash, role: 'vendor', isEmailVerified: true },
    ]);
    // Customers (20)
    const customerData = [
        { name: 'Aditya Kumar', email: 'aditya@example.com' },
        { name: 'Sneha Reddy', email: 'sneha@example.com' },
        { name: 'Rohan Das', email: 'rohan@example.com' },
        { name: 'Anjali Gupta', email: 'anjali@example.com' },
        { name: 'Karan Malhotra', email: 'karan@example.com' },
        { name: 'Divya Iyer', email: 'divya@example.com' },
        { name: 'Nikhil Joshi', email: 'nikhil@example.com' },
        { name: 'Pooja Sinha', email: 'pooja@example.com' },
        { name: 'Abhishek Rao', email: 'abhishek@example.com' },
        { name: 'Meera Pillai', email: 'meera@example.com' },
        { name: 'Rajesh Verma', email: 'rajesh@example.com' },
        { name: 'Sunita Choudhary', email: 'sunita@example.com' },
        { name: 'Manish Tiwari', email: 'manish@example.com' },
        { name: 'Deepika Pandey', email: 'deepika@example.com' },
        { name: 'Sanjay Bhatt', email: 'sanjay@example.com' },
        { name: 'Neha Saxena', email: 'neha@example.com' },
        { name: 'Gaurav Shah', email: 'gaurav@example.com' },
        { name: 'Ritu Agarwal', email: 'ritu@example.com' },
        { name: 'Suresh Mishra', email: 'suresh@example.com' },
        { name: 'Lalita Devi', email: 'lalita@example.com' },
    ];
    const customers = await User.create(customerData.map((c) => ({
        ...c, password: passwordHash, role: 'customer', isEmailVerified: true, isActive: true,
        avatar: `${CLOUDINARY_BASE}/photo-1472099645785-5658abf4ff4e?w=200`,
    })));
    console.log('🏪 Creating vendors...');
    const vendorStores = await Vendor.create([
        {
            user: vendorUsers[0]._id, storeName: 'UrbanThreads', storeSlug: 'urban-threads',
            storeLogo: `${CLOUDINARY_BASE}/photo-1521572163474-6864f9cf17ab?w=200`,
            storeBanner: `${CLOUDINARY_BASE}/photo-1490578474895-699cd4e2cf59?w=1200`,
            storeDescription: 'Premium urban streetwear and casual fashion for the modern generation. We bring you the latest trends at competitive prices.',
            businessEmail: 'vendor1@styleverse.com', businessPhone: '9876543210',
            bankDetails: { accountName: 'Rahul Sharma', accountNumber: '123456789012', ifscCode: 'HDFC0001234', bankName: 'HDFC Bank' },
            address: { addressLine1: '42 Fashion Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
            status: 'approved', commissionRate: 10, totalSales: 240, totalRevenue: 485200, rating: 4.5, reviewCount: 128, isVerified: true,
        },
        {
            user: vendorUsers[1]._id, storeName: 'EthnicCraft', storeSlug: 'ethnic-craft',
            storeLogo: `${CLOUDINARY_BASE}/photo-1583391733981-8498408ee4b2?w=200`,
            storeBanner: `${CLOUDINARY_BASE}/photo-1617627143233-4df547d06a15?w=1200`,
            storeDescription: 'Celebrating Indian culture through traditional ethnic wear. Kurtis, sarees, lehengas and more handcrafted with love.',
            businessEmail: 'vendor2@styleverse.com', businessPhone: '9876543211',
            bankDetails: { accountName: 'Priya Patel', accountNumber: '234567890123', ifscCode: 'ICIC0001234', bankName: 'ICICI Bank' },
            address: { addressLine1: '15 Silk Road', city: 'Surat', state: 'Gujarat', pincode: '395001' },
            status: 'approved', commissionRate: 8, totalSales: 180, totalRevenue: 324000, rating: 4.7, reviewCount: 89, isVerified: true,
        },
        {
            user: vendorUsers[2]._id, storeName: 'SportsElite', storeSlug: 'sports-elite',
            storeLogo: `${CLOUDINARY_BASE}/photo-1517963879433-6ad2b056d712?w=200`,
            storeBanner: `${CLOUDINARY_BASE}/photo-1517963879433-6ad2b056d712?w=1200`,
            storeDescription: 'Your one-stop destination for professional sports and fitness apparel. We stock only the best performance brands.',
            businessEmail: 'vendor3@styleverse.com', businessPhone: '9876543212',
            bankDetails: { accountName: 'Arjun Mehta', accountNumber: '345678901234', ifscCode: 'SBIN0001234', bankName: 'SBI' },
            address: { addressLine1: '88 Sports Complex', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
            status: 'approved', commissionRate: 12, totalSales: 310, totalRevenue: 620000, rating: 4.6, reviewCount: 215, isVerified: true,
        },
        {
            user: vendorUsers[3]._id, storeName: 'LuxuryVault', storeSlug: 'luxury-vault',
            storeLogo: `${CLOUDINARY_BASE}/photo-1524592094714-0f0654e20314?w=200`,
            storeBanner: `${CLOUDINARY_BASE}/photo-1524592094714-0f0654e20314?w=1200`,
            storeDescription: 'Curated collection of luxury watches, bags and accessories from world-renowned brands.',
            businessEmail: 'vendor4@styleverse.com', businessPhone: '9876543213',
            bankDetails: { accountName: 'Kavya Nair', accountNumber: '456789012345', ifscCode: 'AXIB0001234', bankName: 'Axis Bank' },
            address: { addressLine1: '7 Luxury Lane', city: 'Delhi', state: 'Delhi', pincode: '110001' },
            status: 'approved', commissionRate: 15, totalSales: 95, totalRevenue: 1425000, rating: 4.8, reviewCount: 47, isVerified: true,
        },
        {
            user: vendorUsers[4]._id, storeName: 'KidsFashion Hub', storeSlug: 'kids-fashion-hub',
            storeLogo: `${CLOUDINARY_BASE}/photo-1503944168849-8bf86875bbd8?w=200`,
            storeBanner: `${CLOUDINARY_BASE}/photo-1503944168849-8bf86875bbd8?w=1200`,
            storeDescription: 'Fun, colorful, and comfortable clothing for your little ones. Safe, durable, and adorable.',
            businessEmail: 'vendor5@styleverse.com', businessPhone: '9876543214',
            bankDetails: { accountName: 'Vikram Singh', accountNumber: '567890123456', ifscCode: 'KOTK0001234', bankName: 'Kotak Bank' },
            address: { addressLine1: '23 Kids Lane', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
            status: 'approved', commissionRate: 9, totalSales: 150, totalRevenue: 225000, rating: 4.4, reviewCount: 76, isVerified: true,
        },
    ]);
    console.log('📂 Creating categories...');
    const categories = await Category.create(CATEGORY_DATA.map((c) => ({
        ...c, productCount: randomInt(10, 80),
        seo: { title: `${c.name} - StyleVerse`, description: c.description },
    })));
    console.log('🏷️  Creating brands...');
    const brands = await Brand.create(BRAND_DATA.map((b) => ({
        ...b, productCount: randomInt(5, 30),
    })));
    const brandMap = {};
    brands.forEach((b) => { brandMap[b.slug] = b._id; });
    const catMap = {};
    categories.forEach((c) => { catMap[c.slug] = c._id; });
    console.log('👗 Creating 50 fashion products...');
    const PRODUCTS_DATA = [
        // ========== NIKE ==========
        {
            name: 'Nike Air Max 270 Running Shoes', brand: 'nike', category: 'footwear', vendor: 0,
            desc: 'The Nike Air Max 270 features the biggest Air heel unit to date, delivering unrivaled comfort that\'s visible from the side. The mesh upper keeps your foot cool and breathable throughout the day.',
            short: 'Iconic Air Max cushioning for all-day comfort', images: PRODUCT_IMAGES.shoes,
            variants: SHOE_SIZES.map((s, i) => ({
                size: s, color: 'White', colorCode: '#FFFFFF', price: 7999, mrp: 11999, stock: 15,
                images: PRODUCT_IMAGES.shoes, sku: generateSKU('NIK', i + 1),
            })),
            tags: ['nike', 'running', 'shoes', 'air max', 'sport'],
            isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false,
        },
        {
            name: 'Nike Dri-FIT Training T-Shirt', brand: 'nike', category: 'sports-wear', vendor: 2,
            desc: 'Engineered to move with your body, this training tee features Nike\'s signature Dri-FIT technology that wicks sweat and dries fast. The relaxed fit allows freedom of movement for intense workouts.',
            short: 'Sweat-wicking Dri-FIT technology for peak performance', images: PRODUCT_IMAGES.tshirt,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Black', colorCode: '#000000', price: 1499, mrp: 2499, stock: 25,
                images: PRODUCT_IMAGES.tshirt, sku: generateSKU('NIK', i + 10),
            })),
            tags: ['nike', 'dri-fit', 'training', 'sport'],
            isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: true,
        },
        // ========== LEVI'S ==========
        {
            name: "Levi's 511 Slim Fit Jeans", brand: 'levis', category: 'men', vendor: 0,
            desc: 'The 511 Slim Fit Jeans by Levi\'s sit below the waist with a slim fit from hip to ankle. Made with a blend of cotton and stretch material, these jeans move with you all day. Available in various washes.',
            short: 'Classic slim fit jeans with stretch comfort', images: PRODUCT_IMAGES.jeans,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 3499, mrp: 5999, stock: 20,
                images: PRODUCT_IMAGES.jeans, sku: generateSKU('LEV', i + 1),
            })),
            tags: ["levi's", 'jeans', 'denim', 'slim fit', 'men'],
            isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true,
        },
        {
            name: "Levi's Women's 721 High Rise Skinny Jeans", brand: 'levis', category: 'women', vendor: 0,
            desc: 'Levi\'s 721 High Rise Skinny Jeans are designed to hug your curves in all the right places. The high rise sits above your natural waist for a flattering silhouette you\'ll love.',
            short: 'High-rise skinny jeans for the perfect silhouette', images: PRODUCT_IMAGES.jeans,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Black', colorCode: '#000000', price: 3999, mrp: 6499, stock: 18,
                images: PRODUCT_IMAGES.jeans, sku: generateSKU('LEV', i + 10),
            })),
            tags: ["levi's", 'jeans', 'women', 'skinny', 'high rise'],
            isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false,
        },
        // ========== H&M ==========
        {
            name: 'H&M Slim Fit Oxford Shirt', brand: 'hm', category: 'men', vendor: 0,
            desc: 'A wardrobe staple made from pure cotton for all-day comfort. This slim-fit shirt features a classic collar, button placket, and long sleeves with cuff buttons. Perfect for both formal and casual occasions.',
            short: 'Classic Oxford shirt for everyday elegance', images: PRODUCT_IMAGES.tshirt,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'White', colorCode: '#FFFFFF', price: 1199, mrp: 1999, stock: 30,
                images: PRODUCT_IMAGES.tshirt, sku: generateSKU('HM', i + 1),
            })),
            tags: ['hm', 'shirt', 'oxford', 'formal', 'men'],
            isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true,
        },
        {
            name: 'H&M Wrap Midi Dress', brand: 'hm', category: 'women', vendor: 0,
            desc: 'Effortlessly chic midi dress with a wrap style front and flowy fabric. The adjustable tie waist creates a flattering silhouette for any body type. Available in multiple prints.',
            short: 'Flowy wrap dress for every occasion', images: PRODUCT_IMAGES.dress,
            variants: ['S', 'M', 'L', 'XL'].map((s, i) => ({
                size: s, color: 'Pink', colorCode: '#FF69B4', price: 1699, mrp: 2999, stock: 22,
                images: PRODUCT_IMAGES.dress, sku: generateSKU('HM', i + 10),
            })),
            tags: ['hm', 'dress', 'women', 'midi', 'wrap'],
            isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false,
        },
        // ========== ZARA ==========
        {
            name: 'Zara Textured Biker Jacket', brand: 'zara', category: 'women', vendor: 0,
            desc: 'A contemporary biker jacket crafted from faux leather with textured details. Features notched lapels, zip fastening front, and zip cuffs. The perfect statement piece to elevate any outfit.',
            short: 'Statement biker jacket for the bold woman', images: PRODUCT_IMAGES.jacket,
            variants: ['XS', 'S', 'M', 'L'].map((s, i) => ({
                size: s, color: 'Black', colorCode: '#000000', price: 5999, mrp: 9999, stock: 10,
                images: PRODUCT_IMAGES.jacket, sku: generateSKU('ZAR', i + 1),
            })),
            tags: ['zara', 'jacket', 'biker', 'women', 'faux leather'],
            isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false,
        },
        {
            name: 'Zara Floral Print Maxi Dress', brand: 'zara', category: 'women', vendor: 0,
            desc: 'Light and airy maxi dress featuring an all-over floral print. V-neckline with adjustable straps and tiered skirt create a romantic silhouette perfect for summer occasions.',
            short: 'Romantic floral maxi dress for summer', images: PRODUCT_IMAGES.dress,
            variants: ['XS', 'S', 'M', 'L', 'XL'].map((s, i) => ({
                size: s, color: 'White', colorCode: '#FFFFFF', price: 3499, mrp: 5999, stock: 15,
                images: PRODUCT_IMAGES.dress, sku: generateSKU('ZAR', i + 10),
            })),
            tags: ['zara', 'dress', 'floral', 'maxi', 'summer'],
            isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false,
        },
        // ========== PUMA ==========
        {
            name: 'Puma RS-X Reinvention Sneakers', brand: 'puma', category: 'footwear', vendor: 2,
            desc: 'The RS-X Reinvention takes Puma\'s iconic RS Running System and gives it a modern makeover. Chunky sole, bold colorways, and premium materials make this a must-have streetwear staple.',
            short: 'Bold chunky sneakers with RS Running heritage', images: PRODUCT_IMAGES.shoes,
            variants: SHOE_SIZES.map((s, i) => ({
                size: s, color: 'Black', colorCode: '#000000', price: 6499, mrp: 9499, stock: 12,
                images: PRODUCT_IMAGES.shoes, sku: generateSKU('PUM', i + 1),
            })),
            tags: ['puma', 'sneakers', 'rs-x', 'streetwear'],
            isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false,
        },
        {
            name: 'Puma Essential Fleece Hoodie', brand: 'puma', category: 'sports-wear', vendor: 2,
            desc: 'Cozy up in the Puma Essential Fleece Hoodie. Made from soft fleece fabric with the iconic Puma cat logo. Features a kangaroo pocket and adjustable drawstring hood for extra warmth.',
            short: 'Cozy fleece hoodie for active lifestyles', images: PRODUCT_IMAGES.hoodie,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Gray', colorCode: '#808080', price: 2499, mrp: 3999, stock: 20,
                images: PRODUCT_IMAGES.hoodie, sku: generateSKU('PUM', i + 10),
            })),
            tags: ['puma', 'hoodie', 'fleece', 'sport', 'casual'],
            isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: true,
        },
        // ========== ALLEN SOLLY ==========
        {
            name: 'Allen Solly Regular Fit Formal Shirt', brand: 'allen-solly', category: 'men', vendor: 0,
            desc: 'Crafted from premium giza cotton, this regular fit formal shirt offers superior softness and durability. The wrinkle-resistant fabric keeps you looking sharp throughout the day.',
            short: 'Premium formal shirt for corporate confidence', images: PRODUCT_IMAGES.tshirt,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'White', colorCode: '#FFFFFF', price: 1799, mrp: 2999, stock: 25,
                images: PRODUCT_IMAGES.tshirt, sku: generateSKU('AS', i + 1),
            })),
            tags: ['allen solly', 'formal', 'shirt', 'corporate'],
            isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true,
        },
        {
            name: 'Allen Solly Slim Fit Chinos', brand: 'allen-solly', category: 'men', vendor: 0,
            desc: 'These slim-fit chinos are made from stretch cotton fabric for maximum comfort and movement. A versatile wardrobe essential that transitions effortlessly from office to weekend.',
            short: 'Stretch chinos for the modern professional', images: PRODUCT_IMAGES.jeans,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Olive', colorCode: '#808000', price: 2199, mrp: 3499, stock: 18,
                images: PRODUCT_IMAGES.jeans, sku: generateSKU('AS', i + 10),
            })),
            tags: ['allen solly', 'chinos', 'formal', 'slim fit'],
            isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false,
        },
        // ========== US POLO ==========
        {
            name: 'U.S. Polo Assn. Classic Polo T-Shirt', brand: 'us-polo', category: 'men', vendor: 0,
            desc: 'The iconic polo shirt from U.S. Polo Assn. features classic piqué fabric, ribbed collar, and signature embroidery. A timeless piece that never goes out of style.',
            short: 'Iconic polo shirt for timeless style', images: PRODUCT_IMAGES.tshirt,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 999, mrp: 1799, stock: 35,
                images: PRODUCT_IMAGES.tshirt, sku: generateSKU('USP', i + 1),
            })),
            tags: ['us polo', 'polo', 'tshirt', 'classic'],
            isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true,
        },
        // ========== ADIDAS ==========
        {
            name: 'Adidas Ultraboost 22 Running Shoes', brand: 'adidas', category: 'footwear', vendor: 2,
            desc: 'Experience incredible energy return with every step in the Adidas Ultraboost 22. Featuring the revolutionary BOOST midsole and Primeknit upper that adapts to your foot\'s natural movement.',
            short: 'Maximum energy return for serious runners', images: PRODUCT_IMAGES.shoes,
            variants: SHOE_SIZES.map((s, i) => ({
                size: s, color: 'Black', colorCode: '#000000', price: 14999, mrp: 17999, stock: 8,
                images: PRODUCT_IMAGES.shoes, sku: generateSKU('ADI', i + 1),
            })),
            tags: ['adidas', 'ultraboost', 'running', 'shoes'],
            isFeatured: true, isNewArrival: false, isTrending: true, isBestSeller: true,
        },
        {
            name: 'Adidas Tiro 23 Track Pants', brand: 'adidas', category: 'sports-wear', vendor: 2,
            desc: 'The Tiro 23 Track Pants are engineered for training performance. Made with recycled materials, featuring moisture-absorbing AEROREADY technology and zip pockets for secure storage.',
            short: 'Performance track pants with AEROREADY technology', images: PRODUCT_IMAGES.jeans,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Black', colorCode: '#000000', price: 2999, mrp: 4499, stock: 20,
                images: PRODUCT_IMAGES.jeans, sku: generateSKU('ADI', i + 10),
            })),
            tags: ['adidas', 'track pants', 'training', 'sport'],
            isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false,
        },
        // ========== TOMMY HILFIGER ==========
        {
            name: 'Tommy Hilfiger Essential Flag Polo', brand: 'tommy-hilfiger', category: 'men', vendor: 0,
            desc: 'The Essential Flag Polo is a Tommy Hilfiger signature piece. Crafted from premium cotton piqué fabric with the iconic flag logo embroidered on the chest. Ribbed collar and cuffs for a classic finish.',
            short: 'Signature polo with iconic flag embroidery', images: PRODUCT_IMAGES.tshirt,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 3999, mrp: 5999, stock: 15,
                images: PRODUCT_IMAGES.tshirt, sku: generateSKU('TH', i + 1),
            })),
            tags: ['tommy hilfiger', 'polo', 'premium', 'classic'],
            isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true,
        },
        {
            name: 'Tommy Hilfiger Slim Straight Jeans', brand: 'tommy-hilfiger', category: 'men', vendor: 0,
            desc: 'Classic American style meets modern comfort in these slim straight jeans. Made with stretch denim for the perfect fit. Signature Tommy Hilfiger hardware throughout.',
            short: 'American classic denim with modern stretch', images: PRODUCT_IMAGES.jeans,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 5499, mrp: 8999, stock: 12,
                images: PRODUCT_IMAGES.jeans, sku: generateSKU('TH', i + 10),
            })),
            tags: ['tommy hilfiger', 'jeans', 'denim', 'slim'],
            isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false,
        },
        // ========== ROADSTER ==========
        {
            name: 'Roadster Oversized Graphic Tee', brand: 'roadster', category: 'men', vendor: 0,
            desc: 'Make a statement with this oversized graphic tee from Roadster. Features bold urban artwork and a relaxed fit that\'s perfect for streetwear enthusiasts. Made from 100% cotton for all-day comfort.',
            short: 'Bold streetwear graphic tee for the rebels', images: PRODUCT_IMAGES.tshirt,
            variants: SIZES.map((s, i) => ({
                size: s, color: 'Black', colorCode: '#000000', price: 799, mrp: 1299, stock: 40,
                images: PRODUCT_IMAGES.tshirt, sku: generateSKU('ROD', i + 1),
            })),
            tags: ['roadster', 'graphic tee', 'streetwear', 'oversized'],
            isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false,
        },
        // ========== ONLY ==========
        {
            name: 'ONLY Onlpopstar Life Skinny Jeans', brand: 'only', category: 'women', vendor: 0,
            desc: 'These ultra-stretch skinny jeans from ONLY fit like a second skin. High-waist cut with clean lines and a sleek look. Perfect for day-to-night transitions with minimal effort.',
            short: 'Ultra-stretch high-waist skinny jeans', images: PRODUCT_IMAGES.jeans,
            variants: ['XS', 'S', 'M', 'L'].map((s, i) => ({
                size: s, color: 'Black', colorCode: '#000000', price: 2499, mrp: 3999, stock: 20,
                images: PRODUCT_IMAGES.jeans, sku: generateSKU('ONL', i + 1),
            })),
            tags: ['only', 'jeans', 'skinny', 'women', 'high waist'],
            isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false,
        },
        {
            name: 'ONLY Off-Shoulder Ruffle Dress', brand: 'only', category: 'women', vendor: 0,
            desc: 'A playful off-shoulder dress with cascading ruffles that add a romantic feminine touch. The smocked bodice ensures a perfect fit, while the flowy midi skirt moves beautifully.',
            short: 'Playful ruffle dress for romantic occasions', images: PRODUCT_IMAGES.dress,
            variants: ['XS', 'S', 'M', 'L'].map((s, i) => ({
                size: s, color: 'White', colorCode: '#FFFFFF', price: 1999, mrp: 3499, stock: 15,
                images: PRODUCT_IMAGES.dress, sku: generateSKU('ONL', i + 10),
            })),
            tags: ['only', 'dress', 'off shoulder', 'ruffle', 'women'],
            isFeatured: true, isNewArrival: true, isTrending: false, isBestSeller: false,
        },
        // ========== BIBA ==========
        {
            name: 'BIBA Embroidered Anarkali Kurti', brand: 'biba', category: 'ethnic-wear', vendor: 1,
            desc: 'Exquisitely embroidered Anarkali-style kurti from BIBA. Crafted from cotton-silk blend fabric featuring intricate thread work at the neckline and hem. Pair with leggings or churidar for a complete traditional look.',
            short: 'Graceful Anarkali with intricate embroidery', images: PRODUCT_IMAGES.kurti,
            variants: ['XS', 'S', 'M', 'L', 'XL'].map((s, i) => ({
                size: s, color: 'Maroon', colorCode: '#800000', price: 2499, mrp: 3999, stock: 18,
                images: PRODUCT_IMAGES.kurti, sku: generateSKU('BIB', i + 1),
            })),
            tags: ['biba', 'kurti', 'anarkali', 'ethnic', 'embroidered'],
            isFeatured: true, isNewArrival: true, isTrending: false, isBestSeller: true,
        },
        {
            name: 'BIBA Cotton Printed Straight Kurti', brand: 'biba', category: 'ethnic-wear', vendor: 1,
            desc: 'A versatile straight-cut kurti in breathable cotton fabric with traditional block print design. Features 3/4 sleeves and V-neckline with subtle embroidery details. Perfect for daily wear and casual occasions.',
            short: 'Comfortable cotton kurti for everyday elegance', images: PRODUCT_IMAGES.kurti,
            variants: ['XS', 'S', 'M', 'L', 'XL'].map((s, i) => ({
                size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 1299, mrp: 1999, stock: 25,
                images: PRODUCT_IMAGES.kurti, sku: generateSKU('BIB', i + 10),
            })),
            tags: ['biba', 'kurti', 'cotton', 'printed', 'ethnic'],
            isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false,
        },
        // ========== FOSSIL ==========
        {
            name: 'Fossil Gen 6 Smartwatch', brand: 'fossil', category: 'watches', vendor: 3,
            desc: 'The Fossil Gen 6 brings you the latest in smartwatch technology with a classic analog aesthetic. Features SpO2 monitoring, GPS tracking, heart rate monitoring, and up to 24 hours battery life.',
            short: 'Premium smartwatch with health monitoring', images: PRODUCT_IMAGES.watch,
            variants: [{ size: 'Free Size', color: 'Black', colorCode: '#000000', price: 18999, mrp: 24999, stock: 8, images: PRODUCT_IMAGES.watch, sku: generateSKU('FOS', 1) }],
            tags: ['fossil', 'smartwatch', 'gen6', 'luxury'],
            isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false,
        },
        {
            name: 'Fossil Townsman Chronograph Watch', brand: 'fossil', category: 'watches', vendor: 3,
            desc: 'A sophisticated timepiece with a stainless steel case, genuine leather strap, and chronograph functionality. Water resistant to 50m. The Townsman is the perfect companion for the discerning gentleman.',
            short: 'Sophisticated chronograph for the modern gentleman', images: PRODUCT_IMAGES.watch,
            variants: [{ size: 'Free Size', color: 'Brown', colorCode: '#8B4513', price: 14999, mrp: 19999, stock: 5, images: PRODUCT_IMAGES.watch, sku: generateSKU('FOS', 2) }],
            tags: ['fossil', 'watch', 'chronograph', 'leather', 'men'],
            isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true,
        },
        // ========== TITAN ==========
        {
            name: 'Titan Raga Women\'s Watch', brand: 'titan', category: 'watches', vendor: 3,
            desc: 'The Titan Raga collection embodies feminine elegance with this rose gold-toned watch. Features a mesh bracelet, mother-of-pearl dial, and Swarovski crystals. A symbol of refined taste.',
            short: 'Elegant women\'s watch with Swarovski crystals', images: PRODUCT_IMAGES.watch,
            variants: [{ size: 'Free Size', color: 'Rose Gold', colorCode: '#B76E79', price: 8999, mrp: 12999, stock: 10, images: PRODUCT_IMAGES.watch, sku: generateSKU('TIT', 1) }],
            tags: ['titan', 'raga', 'watch', 'women', 'elegant'],
            isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true,
        },
        {
            name: 'Titan Edge Ultra-Slim Watch', brand: 'titan', category: 'watches', vendor: 3,
            desc: 'The world\'s slimmest watch with a titanium case just 3.5mm thick. The Titan Edge is a marvel of engineering that sits perfectly flat on the wrist while delivering precise timekeeping.',
            short: 'World\'s slimmest titanium watch', images: PRODUCT_IMAGES.watch,
            variants: [{ size: 'Free Size', color: 'Silver', colorCode: '#C0C0C0', price: 11999, mrp: 15999, stock: 6, images: PRODUCT_IMAGES.watch, sku: generateSKU('TIT', 2) }],
            tags: ['titan', 'edge', 'ultra slim', 'titanium', 'men'],
            isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false,
        },
        // ========== WILDCRAFT ==========
        {
            name: 'Wildcraft Latitude 40L Hiking Backpack', brand: 'wildcraft', category: 'bags', vendor: 3,
            desc: 'Built for the serious adventurer, the Wildcraft Latitude 40L backpack features an ergonomic suspension system, multiple compartments, hydration sleeve, and heavy-duty zippers. Waterproof material ensures gear stays dry.',
            short: 'Rugged 40L backpack for outdoor adventures', images: PRODUCT_IMAGES.bag,
            variants: [{ size: 'Free Size', color: 'Black', colorCode: '#000000', price: 3499, mrp: 4999, stock: 15, images: PRODUCT_IMAGES.bag, sku: generateSKU('WLD', 1) }],
            tags: ['wildcraft', 'backpack', 'hiking', 'outdoor', 'travel'],
            isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true,
        },
        {
            name: 'Wildcraft Weekend Duffel Bag', brand: 'wildcraft', category: 'bags', vendor: 3,
            desc: 'The perfect travel companion for short trips. This duffel bag features a spacious main compartment, side pockets, and a padded shoulder strap. Made from durable nylon with water-resistant coating.',
            short: 'Versatile duffel for weekenders', images: PRODUCT_IMAGES.bag,
            variants: [
                { size: 'Free Size', color: 'Black', colorCode: '#000000', price: 1999, mrp: 2999, stock: 20, images: PRODUCT_IMAGES.bag, sku: generateSKU('WLD', 2) },
                { size: 'Free Size', color: 'Navy Blue', colorCode: '#001F5B', price: 1999, mrp: 2999, stock: 12, images: PRODUCT_IMAGES.bag, sku: generateSKU('WLD', 3) },
            ],
            tags: ['wildcraft', 'duffel', 'travel', 'bag'],
            isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false,
        },
        // ========== MORE PRODUCTS ==========
        // Men's collection
        { name: 'Roadster Cargo Shorts', brand: 'roadster', category: 'men', vendor: 0,
            desc: 'Versatile cargo shorts with multiple pockets. Made from durable cotton-linen blend. Perfect for casual outings and weekend adventures.', short: 'Utility cargo shorts for the modern man', images: PRODUCT_IMAGES.jeans,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Olive', colorCode: '#808000', price: 899, mrp: 1499, stock: 30, images: PRODUCT_IMAGES.jeans, sku: generateSKU('ROD', i + 20) })),
            tags: ['roadster', 'shorts', 'cargo', 'casual', 'men'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false },
        { name: 'H&M Slim Fit Chino Trousers', brand: 'hm', category: 'men', vendor: 0,
            desc: 'Smart chino trousers in a slim fit. Smooth fabric, straight legs, and side pockets. Great for casual Fridays and weekend brunch.', short: 'Smart slim chinos for work and play', images: PRODUCT_IMAGES.jeans,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Beige', colorCode: '#F5F5DC', price: 1499, mrp: 2499, stock: 22, images: PRODUCT_IMAGES.jeans, sku: generateSKU('HM2', i + 1) })),
            tags: ['hm', 'chinos', 'slim', 'men'], isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false },
        // Women's collection
        { name: 'Zara Satin Slip Dress', brand: 'zara', category: 'women', vendor: 0,
            desc: 'Luxurious satin slip dress in a minimalist design. Adjustable straps and a bias-cut skirt that flows elegantly. Dress up or down for any occasion.', short: 'Effortlessly elegant satin slip dress', images: PRODUCT_IMAGES.dress,
            variants: ['XS', 'S', 'M', 'L'].map((s, i) => ({ size: s, color: 'Black', colorCode: '#000000', price: 3999, mrp: 5999, stock: 12, images: PRODUCT_IMAGES.dress, sku: generateSKU('ZAR2', i + 1) })),
            tags: ['zara', 'satin', 'slip dress', 'women', 'minimal'], isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false },
        { name: 'ONLY Ribbed Knit Sweater', brand: 'only', category: 'women', vendor: 0,
            desc: 'Cozy ribbed knit sweater in a relaxed fit. Perfect layering piece for cooler days. Features a round neck and long sleeves.', short: 'Cozy ribbed sweater for cool days', images: PRODUCT_IMAGES.hoodie,
            variants: ['XS', 'S', 'M', 'L', 'XL'].map((s, i) => ({ size: s, color: 'Maroon', colorCode: '#800000', price: 1499, mrp: 2499, stock: 18, images: PRODUCT_IMAGES.hoodie, sku: generateSKU('ONL2', i + 1) })),
            tags: ['only', 'sweater', 'knit', 'women', 'winter'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false },
        // Ethnic wear
        { name: 'BIBA Banarasi Silk Saree', brand: 'biba', category: 'ethnic-wear', vendor: 1,
            desc: 'Pure Banarasi silk saree with intricate zari work and traditional motifs. This timeless piece comes with a matching unstitched blouse piece. Perfect for weddings and festivities.', short: 'Timeless Banarasi silk for festive occasions', images: PRODUCT_IMAGES.saree,
            variants: [{ size: 'Free Size', color: 'Maroon', colorCode: '#800000', price: 8999, mrp: 14999, stock: 5, images: PRODUCT_IMAGES.saree, sku: generateSKU('BIB2', 1) }],
            tags: ['biba', 'saree', 'banarasi', 'silk', 'wedding'], isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: false },
        // Winter collection
        { name: 'Roadster Puffer Jacket', brand: 'roadster', category: 'winter-collection', vendor: 0,
            desc: 'Stay warm and stylish in this lightweight puffer jacket. Features premium down filling, packable design, and wind-resistant outer shell.', short: 'Lightweight puffer for winter adventures', images: PRODUCT_IMAGES.jacket,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 2999, mrp: 4999, stock: 15, images: PRODUCT_IMAGES.jacket, sku: generateSKU('ROD2', i + 1) })),
            tags: ['roadster', 'puffer', 'jacket', 'winter', 'warm'], isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false },
        { name: 'H&M Wool Blend Overcoat', brand: 'hm', category: 'winter-collection', vendor: 0,
            desc: 'Classic overcoat crafted from a premium wool-polyester blend. Single-breasted with notched lapels and front button closure. A sophisticated winter essential.', short: 'Sophisticated wool overcoat for winter', images: PRODUCT_IMAGES.jacket,
            variants: ['S', 'M', 'L', 'XL'].map((s, i) => ({ size: s, color: 'Gray', colorCode: '#808080', price: 4999, mrp: 7999, stock: 10, images: PRODUCT_IMAGES.jacket, sku: generateSKU('HM3', i + 1) })),
            tags: ['hm', 'overcoat', 'wool', 'winter', 'formal'], isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: false },
        // Sports
        { name: 'Nike Pro Compression Tights', brand: 'nike', category: 'sports-wear', vendor: 2,
            desc: 'Nike Pro Compression Tights provide targeted support and breathability for intense training. Dri-FIT technology moves sweat away from your skin for a dry, comfortable feel.', short: 'Performance compression tights for training', images: PRODUCT_IMAGES.jeans,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Black', colorCode: '#000000', price: 2499, mrp: 3999, stock: 20, images: PRODUCT_IMAGES.jeans, sku: generateSKU('NIK2', i + 1) })),
            tags: ['nike', 'compression', 'tights', 'training', 'sport'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true },
        { name: 'Adidas Response Trail Running Shoes', brand: 'adidas', category: 'footwear', vendor: 2,
            desc: 'Designed for off-road runners, the Adidas Response Trail features a grippy Adiwear outsole, cushioned midsole, and breathable mesh upper for confident running on any terrain.', short: 'Trail running shoes for any terrain', images: PRODUCT_IMAGES.shoes,
            variants: SHOE_SIZES.map((s, i) => ({ size: s, color: 'Gray', colorCode: '#808080', price: 5499, mrp: 7999, stock: 10, images: PRODUCT_IMAGES.shoes, sku: generateSKU('ADI2', i + 1) })),
            tags: ['adidas', 'trail running', 'shoes', 'sport'], isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false },
        // Bags
        { name: 'H&M Faux Leather Tote Bag', brand: 'hm', category: 'bags', vendor: 0,
            desc: 'Minimalist tote bag in soft faux leather. Features a zip top closure, interior pocket, and long shoulder straps. Perfectly sized for everyday essentials.', short: 'Sleek faux leather tote for daily use', images: PRODUCT_IMAGES.bag,
            variants: [
                { size: 'Free Size', color: 'Black', colorCode: '#000000', price: 1999, mrp: 2999, stock: 25, images: PRODUCT_IMAGES.bag, sku: generateSKU('HM4', 1) },
                { size: 'Free Size', color: 'Beige', colorCode: '#F5F5DC', price: 1999, mrp: 2999, stock: 15, images: PRODUCT_IMAGES.bag, sku: generateSKU('HM4', 2) },
            ],
            tags: ['hm', 'tote', 'bag', 'women', 'faux leather'], isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false },
        // Accessories
        { name: 'Tommy Hilfiger Leather Belt', brand: 'tommy-hilfiger', category: 'accessories', vendor: 0,
            desc: 'Classic leather belt with signature Tommy Hilfiger plaque buckle. Made from genuine leather with silver-tone hardware. A versatile accessory for both formal and casual looks.', short: 'Genuine leather belt with signature buckle', images: PRODUCT_IMAGES.bag,
            variants: [{ size: 'Free Size', color: 'Brown', colorCode: '#8B4513', price: 1999, mrp: 2999, stock: 20, images: PRODUCT_IMAGES.bag, sku: generateSKU('TH2', 1) }],
            tags: ['tommy hilfiger', 'belt', 'leather', 'accessories'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false },
        // Kids
        { name: 'H&M Kids Graphic Dinosaur Tee', brand: 'hm', category: 'kids', vendor: 4,
            desc: 'Super soft 100% cotton tee featuring a fun dinosaur graphic print. Tagless design for maximum comfort. Machine washable.', short: 'Fun dinosaur tee for little explorers', images: PRODUCT_IMAGES.tshirt,
            variants: ['4-5Y', '6-7Y', '8-9Y', '10-11Y'].map((s, i) => ({ size: s, color: 'White', colorCode: '#FFFFFF', price: 499, mrp: 799, stock: 30, images: PRODUCT_IMAGES.tshirt, sku: generateSKU('HMK', i + 1) })),
            tags: ['hm', 'kids', 'tshirt', 'graphic', 'dinosaur'], isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false },
        { name: 'US Polo Kids Jogger Set', brand: 'us-polo', category: 'kids', vendor: 4,
            desc: 'Comfortable 2-piece jogger set for active kids. Includes a pullover hoodie and matching jogger pants. Made from soft fleece fabric with elastic waistband.', short: 'Cozy 2-piece jogger set for active kids', images: PRODUCT_IMAGES.hoodie,
            variants: ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'].map((s, i) => ({ size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 999, mrp: 1599, stock: 25, images: PRODUCT_IMAGES.hoodie, sku: generateSKU('USPK', i + 1) })),
            tags: ['us polo', 'kids', 'jogger', 'set', 'comfortable'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false },
        // Additional products to reach 50
        { name: 'Nike Air Force 1 Low Sneakers', brand: 'nike', category: 'footwear', vendor: 2,
            desc: 'The legendary Nike Air Force 1 Low returns in its iconic all-white colorway. Leather upper, Air sole unit, and perforated toe box. A timeless sneaker that goes with everything.', short: 'Iconic all-white leather sneakers', images: PRODUCT_IMAGES.shoes,
            variants: SHOE_SIZES.map((s, i) => ({ size: s, color: 'White', colorCode: '#FFFFFF', price: 7499, mrp: 9499, stock: 20, images: PRODUCT_IMAGES.shoes, sku: generateSKU('NIK3', i + 1) })),
            tags: ['nike', 'air force 1', 'sneakers', 'classic', 'white'], isFeatured: true, isNewArrival: false, isTrending: true, isBestSeller: true },
        { name: 'Puma Cali Sport Sneakers', brand: 'puma', category: 'footwear', vendor: 2,
            desc: 'The Puma Cali Sport is a modern take on the California beach lifestyle. Chunky platform sole, leather upper, and Puma signature on the side. Retro vibes meet contemporary style.', short: 'Platform sneakers with California surf vibes', images: PRODUCT_IMAGES.shoes,
            variants: SHOE_SIZES.map((s, i) => ({ size: s, color: 'White', colorCode: '#FFFFFF', price: 8999, mrp: 11999, stock: 15, images: PRODUCT_IMAGES.shoes, sku: generateSKU('PUM2', i + 1) })),
            tags: ['puma', 'cali', 'sneakers', 'platform', 'women'], isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false },
        { name: 'Allen Solly Smart Blazer', brand: 'allen-solly', category: 'men', vendor: 0,
            desc: 'A modern power blazer in premium stretch fabric. Slim-cut with a two-button front closure, welt pockets, and a vent at the back for ease of movement. Available in versatile colors.', short: 'Power blazer for the corporate champion', images: PRODUCT_IMAGES.jacket,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 3999, mrp: 5999, stock: 12, images: PRODUCT_IMAGES.jacket, sku: generateSKU('AS2', i + 1) })),
            tags: ['allen solly', 'blazer', 'formal', 'men', 'corporate'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false },
        { name: 'BIBA Straight Palazzo Set', brand: 'biba', category: 'ethnic-wear', vendor: 1,
            desc: 'Elegant kurti-palazzo combo in fine rayon fabric. The flared palazzo pants and A-line kurti with dupatta create a complete festive look. Block-printed with traditional motifs.', short: 'Complete festive palazzo set with dupatta', images: PRODUCT_IMAGES.kurti,
            variants: ['XS', 'S', 'M', 'L', 'XL'].map((s, i) => ({ size: s, color: 'Pink', colorCode: '#FF69B4', price: 1999, mrp: 3499, stock: 20, images: PRODUCT_IMAGES.kurti, sku: generateSKU('BIB3', i + 1) })),
            tags: ['biba', 'palazzo', 'set', 'ethnic', 'festive'], isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false },
        { name: 'Roadster Hooded Sweatshirt', brand: 'roadster', category: 'men', vendor: 0,
            desc: 'Classic pullover hoodie with Roadster\'s signature graphic. Soft cotton-polyester fleece with kangaroo pocket and adjustable drawstring. Your everyday essential.', short: 'Everyday pullover hoodie with bold graphics', images: PRODUCT_IMAGES.hoodie,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Gray', colorCode: '#808080', price: 1299, mrp: 1999, stock: 35, images: PRODUCT_IMAGES.hoodie, sku: generateSKU('ROD3', i + 1) })),
            tags: ['roadster', 'hoodie', 'sweatshirt', 'casual', 'men'], isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false },
        { name: 'Tommy Hilfiger Stripe Crew Sweatshirt', brand: 'tommy-hilfiger', category: 'men', vendor: 0,
            desc: 'Cozy crew-neck sweatshirt featuring Tommy Hilfiger\'s iconic stripe design across the chest. Made from a soft cotton-polyester blend with a relaxed fit. Perfect for weekends.', short: 'Iconic stripe sweatshirt for weekend comfort', images: PRODUCT_IMAGES.hoodie,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 2999, mrp: 4499, stock: 18, images: PRODUCT_IMAGES.hoodie, sku: generateSKU('TH3', i + 1) })),
            tags: ['tommy hilfiger', 'sweatshirt', 'stripe', 'crew neck', 'casual'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true },
        { name: 'Zara Leather Shoulder Bag', brand: 'zara', category: 'bags', vendor: 0,
            desc: 'Minimalist shoulder bag crafted from premium vegan leather. Features a structured silhouette, adjustable chain strap, and magnetic closure. The perfect accessory to complete any outfit.', short: 'Structured vegan leather shoulder bag', images: PRODUCT_IMAGES.bag,
            variants: [
                { size: 'Free Size', color: 'Black', colorCode: '#000000', price: 4999, mrp: 6999, stock: 10, images: PRODUCT_IMAGES.bag, sku: generateSKU('ZAR3', 1) },
                { size: 'Free Size', color: 'White', colorCode: '#FFFFFF', price: 4999, mrp: 6999, stock: 8, images: PRODUCT_IMAGES.bag, sku: generateSKU('ZAR3', 2) },
            ],
            tags: ['zara', 'shoulder bag', 'leather', 'women', 'luxury'], isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false },
        { name: 'Nike Running Sports Cap', brand: 'nike', category: 'accessories', vendor: 2,
            desc: 'Lightweight and breathable sports cap with Dri-FIT technology. Features an adjustable strap, curved brim, and Nike swoosh branding. Sun protection with UPF 40+.', short: 'Breathable running cap with UPF 40+', images: PRODUCT_IMAGES.tshirt,
            variants: [{ size: 'Free Size', color: 'Black', colorCode: '#000000', price: 999, mrp: 1499, stock: 50, images: PRODUCT_IMAGES.tshirt, sku: generateSKU('NIK4', 1) }],
            tags: ['nike', 'cap', 'running', 'sport', 'accessories'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false },
        { name: 'Adidas Classic 3-Stripe Track Jacket', brand: 'adidas', category: 'sports-wear', vendor: 2,
            desc: 'The iconic Adidas track jacket updated for modern performance. Features the classic 3-stripe design, full-zip front, and moisture-absorbing fabric. A streetwear staple with athletic heritage.', short: 'Classic 3-stripe track jacket for sport & street', images: PRODUCT_IMAGES.jacket,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Black', colorCode: '#000000', price: 3499, mrp: 4999, stock: 22, images: PRODUCT_IMAGES.jacket, sku: generateSKU('ADI3', i + 1) })),
            tags: ['adidas', 'track jacket', '3-stripe', 'sport', 'streetwear'], isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false },
        { name: "Levi's Sherpa-Lined Denim Trucker Jacket", brand: 'levis', category: 'winter-collection', vendor: 0,
            desc: "Levi's iconic Trucker Jacket gets a cozy upgrade with a plush sherpa lining. Classic denim exterior with a warm fleece interior. Four front pockets and a button closure.", short: 'Classic trucker jacket with cozy sherpa lining', images: PRODUCT_IMAGES.jacket,
            variants: SIZES.map((s, i) => ({ size: s, color: 'Navy Blue', colorCode: '#001F5B', price: 6999, mrp: 9999, stock: 8, images: PRODUCT_IMAGES.jacket, sku: generateSKU('LEV2', i + 1) })),
            tags: ["levi's", 'denim', 'jacket', 'trucker', 'sherpa', 'winter'], isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: false },
        { name: 'US Polo Assn. Women Printed Dress', brand: 'us-polo', category: 'women', vendor: 0,
            desc: 'Casual printed dress in soft viscose fabric. Features a V-neckline, short sleeves, and a flared midi skirt. Available in multiple vibrant prints for the free-spirited woman.', short: 'Vibrant printed dress for free spirits', images: PRODUCT_IMAGES.dress,
            variants: ['XS', 'S', 'M', 'L', 'XL'].map((s, i) => ({ size: s, color: 'Pink', colorCode: '#FF69B4', price: 1799, mrp: 2999, stock: 20, images: PRODUCT_IMAGES.dress, sku: generateSKU('USP2', i + 1) })),
            tags: ['us polo', 'dress', 'women', 'printed', 'casual'], isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false },
    ];
    const createdProducts = [];
    for (const p of PRODUCTS_DATA) {
        const vendor = vendorStores[p.vendor];
        const brandDoc = brands.find((b) => b.slug === p.brand);
        const catDoc = categories.find((c) => c.slug === p.category);
        if (!brandDoc || !catDoc)
            continue;
        const imageType = getImageType(p.category, p.name);
        const uniqueImages = getUniqueImagesForCategory(imageType, 4);
        const slug = slugify(p.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).slice(2, 5);
        const product = await Product.create({
            name: p.name,
            slug,
            description: p.desc,
            shortDescription: p.short,
            brand: brandDoc._id,
            category: catDoc._id,
            vendor: vendor._id,
            images: uniqueImages,
            thumbnail: uniqueImages[0],
            basePrice: p.variants[0].price,
            baseMrp: p.variants[0].mrp,
            baseDiscount: Math.round(((p.variants[0].mrp - p.variants[0].price) / p.variants[0].mrp) * 100),
            tags: p.tags,
            status: 'active',
            rating: randomFloat(3.5, 5.0),
            reviewCount: randomInt(5, 200),
            wishlistCount: randomInt(10, 500),
            isFeatured: p.isFeatured,
            isNewArrival: p.isNewArrival,
            isTrending: p.isTrending,
            isBestSeller: p.isBestSeller,
            isOnSale: Math.random() > 0.6,
            viewCount: randomInt(50, 5000),
            seo: { title: `${p.name} – StyleVerse`, description: p.short, keywords: p.tags },
        });
        // Create variants
        const variantIds = [];
        for (const v of p.variants) {
            const variant = await ProductVariant.create({ ...v, product: product._id, images: uniqueImages });
            variantIds.push(variant._id);
        }
        product.variants = variantIds;
        await product.save();
        createdProducts.push(product);
    }
    console.log(`✅ Created ${createdProducts.length} products`);
    console.log('🏠 Creating addresses...');
    const addresses = [];
    for (const customer of customers) {
        const address = await Address.create({
            user: customer._id, name: customer.name, phone: '9' + randomInt(100000000, 999999999),
            addressLine1: `${randomInt(1, 999)} ${randomFrom(['MG Road', 'Park Street', 'Civil Lines', 'Nehru Nagar', 'Gandhi Road'])}`,
            city: randomFrom(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad']),
            state: randomFrom(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat']),
            pincode: String(randomInt(100000, 999999)), country: 'India', isDefault: true,
        });
        addresses.push(address);
    }
    console.log('📦 Creating 30 orders...');
    const orderStatuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'confirmed', 'cancelled'];
    const paymentMethods = ['razorpay', 'cod', 'upi', 'cod', 'razorpay'];
    for (let i = 0; i < 30; i++) {
        const customer = randomFrom(customers);
        const address = randomFrom(addresses.filter((a) => String(a.user) === String(customer._id))) || addresses[0];
        const numItems = randomInt(1, 3);
        const orderProducts = [];
        let subtotal = 0, discount = 0;
        for (let j = 0; j < numItems; j++) {
            const prod = randomFrom(createdProducts);
            const variant = await ProductVariant.findOne({ product: prod._id });
            if (!variant)
                continue;
            const qty = randomInt(1, 2);
            const itemTotal = variant.price * qty;
            subtotal += variant.mrp * qty;
            discount += (variant.mrp - variant.price) * qty;
            orderProducts.push({
                product: prod._id, variant: variant._id, vendor: prod.vendor,
                name: prod.name, thumbnail: prod.thumbnail,
                color: variant.color, size: variant.size,
                quantity: qty, price: variant.price, mrp: variant.mrp,
                discount: Math.round(((variant.mrp - variant.price) / variant.mrp) * 100),
                total: itemTotal, status: randomFrom(orderStatuses),
                returnRequested: false,
            });
        }
        if (orderProducts.length === 0)
            continue;
        const shippingFee = (subtotal - discount) >= 999 ? 0 : 99;
        const tax = Math.round((subtotal - discount) * 0.18);
        const total = subtotal - discount + shippingFee + tax;
        const status = randomFrom(orderStatuses);
        const pm = randomFrom(paymentMethods);
        const createdAt = new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000);
        await Order.create({
            orderNumber: `SV-${createdAt.getTime().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            invoiceNumber: `INV-2024-${String(i + 1).padStart(4, '0')}`,
            user: customer._id,
            items: orderProducts,
            shippingAddress: { name: address.name, phone: address.phone, addressLine1: address.addressLine1, city: address.city, state: address.state, pincode: address.pincode, country: 'India' },
            subtotal, discount, couponDiscount: 0, shippingFee, tax, total,
            paymentMethod: pm, paymentStatus: pm === 'cod' ? (status === 'delivered' ? 'paid' : 'pending') : 'paid',
            status, estimatedDelivery: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
            deliveredAt: status === 'delivered' ? new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000) : undefined,
            createdAt, updatedAt: createdAt,
        });
    }
    console.log('⭐ Creating reviews...');
    const reviewTexts = [
        { title: 'Absolutely love it!', body: 'This product exceeded all my expectations. The quality is outstanding and it fits perfectly. Will definitely buy more from this brand.' },
        { title: 'Great value for money', body: 'Excellent quality product at a very reasonable price. The material is soft and comfortable. Highly recommend!' },
        { title: 'Good product', body: 'Nice product overall. The size was accurate as per the size chart. Delivery was quick too. Happy with my purchase.' },
        { title: 'Perfect for daily use', body: 'Wearing this daily and it still looks new after multiple washes. Great investment. The color is exactly as shown in the pictures.' },
        { title: 'Amazing quality!', body: 'I was skeptical at first but the quality blew me away. Super soft fabric, great stitching, and the color is vibrant. 5 stars!' },
        { title: 'Comfortable and stylish', body: 'Loved the product. Very comfortable for all-day wear. The style is on trend and I got many compliments.' },
        { title: 'Fast delivery, good product', body: 'Received the product within 2 days. Packaging was great. The product matches the description. Satisfied customer.' },
        { title: 'A bit small, good quality', body: 'The product quality is excellent but it runs a bit small. I would suggest sizing up. The fabric is premium.' },
        { title: 'Highly recommended', body: 'One of the best purchases I\'ve made online. The fit is perfect and the material is top-notch. Will buy again for sure.' },
        { title: 'Worth every penny', body: 'Premium quality that justifies the price. The craftsmanship is evident. Been using it for a month and it still looks brand new.' },
    ];
    for (let i = 0; i < Math.min(50, createdProducts.length); i++) {
        const product = createdProducts[i];
        const numReviews = randomInt(2, 5);
        for (let j = 0; j < numReviews; j++) {
            const customer = randomFrom(customers);
            const rt = randomFrom(reviewTexts);
            try {
                await Review.create({
                    product: product._id, user: customer._id,
                    rating: randomFrom([3, 4, 4, 4, 5, 5, 5]),
                    title: rt.title, body: rt.body,
                    status: 'approved', helpfulCount: randomInt(0, 20), isVerifiedPurchase: Math.random() > 0.3,
                });
            }
            catch { /* ignore duplicates */ }
        }
    }
    console.log('🏷️  Creating coupons...');
    await Coupon.create([
        { code: 'WELCOME20', description: '20% off for new customers', type: 'percentage', value: 20, minOrderAmount: 999, maxDiscount: 500, usageLimit: 1000, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), isActive: true, createdBy: admin._id },
        { code: 'FLAT500', description: '₹500 flat off on orders above ₹2999', type: 'fixed', value: 500, minOrderAmount: 2999, usageLimit: 500, expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), isActive: true, createdBy: admin._id },
        { code: 'FREESHIP', description: 'Free shipping on any order', type: 'free_shipping', value: 99, minOrderAmount: 0, usageLimit: 2000, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true, createdBy: admin._id },
        { code: 'FASHION30', description: '30% off fashion items above ₹1999', type: 'percentage', value: 30, minOrderAmount: 1999, maxDiscount: 1000, usageLimit: 200, expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), isActive: true, createdBy: admin._id },
        { code: 'ETHNIC15', description: '15% off on ethnic wear', type: 'percentage', value: 15, minOrderAmount: 1000, usageLimit: 300, expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), isActive: true, createdBy: admin._id },
    ]);
    console.log('📝 Creating blogs...');
    await Blog.create([
        {
            title: '10 Fashion Trends Dominating 2024',
            slug: '10-fashion-trends-2024',
            excerpt: 'From quiet luxury to bold maximalism, here are the trends that are shaping wardrobes this year.',
            content: '<h2>1. Quiet Luxury</h2><p>Minimalism meets opulence. Think neutral palettes, impeccable tailoring, and understated elegance. This trend focuses on quality over quantity.</p><h2>2. Dopamine Dressing</h2><p>Bright, bold colors that make you feel happy. From neon to electric blue, this trend is all about expressing joy through fashion.</p><h2>3. Oversized Silhouettes</h2><p>Comfort meets style with oversized blazers, wide-leg trousers, and boxy tees. The relaxed fit is here to stay.</p><h2>4. Sustainable Fashion</h2><p>Eco-conscious choices are mainstream now. Recycled materials, vintage shopping, and ethical brands are leading the charge.</p><h2>5. Coastal Grandmother</h2><p>Inspired by effortless seaside living – linen sets, flowy dresses, and natural textures in earthy tones.</p>',
            coverImage: `${CLOUDINARY_BASE}/photo-1490578474895-699cd4e2cf59?w=800`,
            author: admin._id, categories: ['Fashion', 'Trends'], tags: ['2024', 'trends', 'fashion', 'style'],
            status: 'published', readTime: 5, viewCount: 1250, publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
            title: 'How to Style a White Shirt 10 Different Ways',
            slug: 'how-to-style-white-shirt-10-ways',
            excerpt: 'The white shirt is one of the most versatile pieces in your wardrobe. Here\'s how to make it work for every occasion.',
            content: '<p>A crisp white shirt is a wardrobe staple that deserves more credit than it gets. Here are 10 ways to elevate this classic piece:</p><h2>1. Tuck it into high-waist jeans</h2><p>A classic combination that never fails. Opt for a half-tuck for a more relaxed look.</p><h2>2. Knot it at the waist</h2><p>Create a chic crop top effect by knotting the shirt at the waist. Pair with midi skirts or wide-leg pants.</p><h2>3. Layer under a blazer</h2><p>The foundation of any power look. Choose a structured blazer and let the white collar peek out.</p><h2>4. Wear it as a dress</h2><p>An oversized white shirt becomes a mini dress when paired with thigh-high boots or sneakers.</p>',
            coverImage: `${CLOUDINARY_BASE}/photo-1521572163474-6864f9cf17ab?w=800`,
            author: admin._id, categories: ['Style Guide', 'Fashion'], tags: ['white shirt', 'styling', 'guide', 'tips'],
            status: 'published', readTime: 4, viewCount: 892, publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
        {
            title: 'Building a Sustainable Capsule Wardrobe',
            slug: 'sustainable-capsule-wardrobe-guide',
            excerpt: 'Less is more. Discover how to build a capsule wardrobe that\'s both sustainable and stylish.',
            content: '<p>A capsule wardrobe consists of a limited number of essential items that don\'t go out of fashion. Here\'s how to build one:</p><h2>The Foundation Pieces</h2><ul><li>A well-fitted white shirt</li><li>Dark wash jeans</li><li>A tailored blazer</li><li>A little black dress</li><li>Neutral trousers</li></ul><h2>Quality Over Quantity</h2><p>Invest in pieces made from natural materials like cotton, linen, and wool. They last longer and have less environmental impact.</p><h2>Color Strategy</h2><p>Stick to a neutral palette with 2-3 accent colors. This ensures everything in your wardrobe works together.</p>',
            coverImage: `${CLOUDINARY_BASE}/photo-1483985988355-763728e1935b?w=800`,
            author: admin._id, categories: ['Sustainability', 'Style Guide'], tags: ['capsule wardrobe', 'sustainable', 'minimalism', 'fashion'],
            status: 'published', readTime: 6, viewCount: 2100, publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        },
    ]);
    console.log('🏞️  Creating banners...');
    await Banner.create([
        { title: 'AJIO LUXE: THE DESIGNER EDIT', subtitle: 'Premium minimalist coordinates and luxury essential layers. Elevate your daily rotation.', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80', mobileImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80', link: '/products?isNewArrival=true', buttonText: 'Explore Collection', position: 0, isActive: true },
        { title: 'UP TO 60% OFF: SNEAKER FESTIVAL', subtitle: 'High-performance kicks and lifestyle drops. Grab Nike, Adidas & Puma.', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=80', mobileImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', link: '/products?category=footwear&isOnSale=true', buttonText: 'Claim Offer', position: 1, isActive: true },
        { title: 'ETHNIC ELEGANCE: FESTIVE SPECIAL', subtitle: 'Exquisite silk coordinates, lehengas and hand-woven heritage outfits.', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80', mobileImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', link: '/products?category=ethnic-wear', buttonText: 'Discover Couture', position: 2, isActive: true },
        { title: 'ACCESSORIES: THE FINE PRINT', subtitle: 'Luxury watches, leather handbags, and high-fashion statement sunglasses.', image: 'https://images.unsplash.com/photo-1524498250077-3a819b76e246?auto=format&fit=crop&w=1600&q=80', mobileImage: 'https://images.unsplash.com/photo-1524498250077-3a819b76e246?auto=format&fit=crop&w=800&q=80', link: '/products?category=accessories', buttonText: 'Shop Luxury', position: 3, isActive: true },
    ]);
    console.log('📄 Creating CMS pages...');
    await CMSPage.create([
        { title: 'About StyleVerse', slug: 'about-us', isActive: true, seo: { title: 'About Us – StyleVerse', description: 'Learn about StyleVerse, India\'s premier fashion marketplace' }, content: '<h1>About StyleVerse</h1><p>StyleVerse was founded in 2024 with a simple yet powerful vision: to create India\'s most trusted and comprehensive fashion marketplace. We believe that great style should be accessible to everyone, regardless of budget or location.</p><h2>Our Mission</h2><p>To connect fashion-conscious consumers with quality vendors across India, offering thousands of products from the country\'s best brands under one roof.</p><h2>Why Choose StyleVerse?</h2><ul><li>Curated selection of 1000+ brands</li><li>Verified vendors for quality assurance</li><li>Easy returns and refunds</li><li>Fast delivery across India</li><li>24/7 customer support</li></ul>' },
        { title: 'Privacy Policy', slug: 'privacy-policy', isActive: true, seo: { title: 'Privacy Policy – StyleVerse', description: 'StyleVerse privacy policy and data protection information' }, content: '<h1>Privacy Policy</h1><p>Last updated: January 1, 2024</p><p>At StyleVerse, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.</p><h2>Information We Collect</h2><p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This includes: name, email, phone, address, and payment information.</p><h2>How We Use Your Information</h2><ul><li>To process your orders and transactions</li><li>To send order confirmations and shipping updates</li><li>To provide customer support</li><li>To improve our services</li><li>To send marketing communications (with your consent)</li></ul>' },
        { title: 'Terms & Conditions', slug: 'terms-conditions', isActive: true, seo: { title: 'Terms & Conditions – StyleVerse', description: 'StyleVerse terms and conditions of service' }, content: '<h1>Terms & Conditions</h1><p>By using StyleVerse, you agree to these terms. Please read them carefully.</p><h2>Use of Service</h2><p>StyleVerse provides an online marketplace platform connecting buyers and sellers. We are not responsible for the quality of products sold by vendors, though we have quality control measures in place.</p><h2>Account Terms</h2><p>You must be 18 years or older to use this service. You are responsible for maintaining the security of your account.</p><h2>Returns Policy</h2><p>Items can be returned within 30 days of delivery if they are unused and in their original packaging.</p>' },
        { title: 'Shipping Policy', slug: 'shipping-policy', isActive: true, seo: { title: 'Shipping Policy – StyleVerse' }, content: '<h1>Shipping Policy</h1><p>We deliver across all states and union territories of India.</p><h2>Delivery Timelines</h2><ul><li>Metro cities: 2-3 business days</li><li>Tier 2 cities: 3-5 business days</li><li>Remote areas: 5-7 business days</li></ul><h2>Shipping Charges</h2><p>Orders above ₹999 qualify for FREE shipping. A flat shipping fee of ₹99 applies to orders below ₹999.</p>' },
        { title: 'Refund Policy', slug: 'refund-policy', isActive: true, seo: { title: 'Refund Policy – StyleVerse' }, content: '<h1>Refund Policy</h1><p>We want you to be completely satisfied with your purchase.</p><h2>Return Eligibility</h2><p>Products can be returned within 30 days of delivery if they are: unused, unwashed, with original tags, and in original packaging.</p><h2>Refund Process</h2><p>Once we receive and inspect the returned item, refunds are processed within 5-7 business days. The amount will be credited to your original payment method.</p><h2>Non-Returnable Items</h2><p>Innerwear, swimwear, and customized products cannot be returned for hygiene reasons.</p>' },
    ]);
    console.log('⚙️  Creating settings...');
    await Settings.create({
        siteName: 'StyleVerse', siteTagline: 'Wear Your World',
        logo: `${CLOUDINARY_BASE}/photo-1490578474895-699cd4e2cf59?w=200`,
        favicon: `${CLOUDINARY_BASE}/photo-1490578474895-699cd4e2cf59?w=32`,
        currency: 'INR', currencySymbol: '₹', tax: 18, shippingFee: 99, freeShippingThreshold: 999,
        defaultCommissionRate: 10, maintenanceMode: false,
        contactEmail: 'support@styleverse.com', contactPhone: '+91 9000000000',
        address: '14th Floor, One World Center, Mumbai, Maharashtra 400013',
        socialLinks: { instagram: 'https://instagram.com/styleverse', facebook: 'https://facebook.com/styleverse', twitter: 'https://twitter.com/styleverse' },
        paymentMethods: { cod: true, razorpay: true, upi: true },
    });
    // Newsletter subscribers
    const newsletterEmails = ['fashion@gmail.com', 'style@yahoo.com', 'trendy@hotmail.com', 'shopaholic@gmail.com', 'fashionista@outlook.com'];
    await Newsletter.create(newsletterEmails.map((e) => ({ email: e, isActive: true, subscribedAt: new Date() })));
    // Notifications for customers
    for (const customer of customers.slice(0, 5)) {
        await Notification.create([
            { user: customer._id, title: 'Welcome to StyleVerse! 🎉', body: 'Your fashion journey starts here. Explore thousands of products from top brands.', type: 'system', isRead: false, link: '/' },
            { user: customer._id, title: 'Flash Sale Alert! ⚡', body: 'Up to 50% off on footwear. Limited time only!', type: 'promo', isRead: false, link: '/products?category=footwear&isOnSale=true' },
        ]);
    }
    console.log('');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║         ✦ SEED COMPLETE – STYLEVERSE ✦         ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('║  Admin:    admin@styleverse.com                ║');
    console.log('║  Password: StyleVerse@123                      ║');
    console.log('║  ──────────────────────────────────────────    ║');
    console.log('║  Vendor 1: vendor1@styleverse.com              ║');
    console.log('║  Vendor 2: vendor2@styleverse.com              ║');
    console.log('║  ──────────────────────────────────────────    ║');
    console.log('║  Customer: aditya@example.com                  ║');
    console.log('║  Password: StyleVerse@123                      ║');
    console.log('╚════════════════════════════════════════════════╝');
    await mongoose.disconnect();
    process.exit(0);
}
seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
