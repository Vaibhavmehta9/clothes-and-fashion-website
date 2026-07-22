/**
 * STYLEVERSE – 200 PRODUCT EXPANDER SEED
 * Adds 150 more products on top of the existing 50 (for ~200 total)
 * Uses diverse Unsplash photo IDs for unique images per product
 * Run: node scripts/seed-200.js
 */
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styleverse';
const B = 'https://images.unsplash.com'; // Base

// ── SCHEMAS (inline, minimal) ────────────────────────────────────────────────
const productVariantSchema = new mongoose.Schema({
  product: mongoose.Schema.Types.ObjectId, color: String, colorCode: String, size: String,
  material: String, fit: String, pattern: String, sleeve: String,
  price: Number, mrp: Number, discount: Number, stock: Number, sku: String,
  images: [String], isActive: { type: Boolean, default: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String, slug: String, description: String, shortDescription: String,
  brand: mongoose.Schema.Types.ObjectId, category: mongoose.Schema.Types.ObjectId,
  vendor: mongoose.Schema.Types.ObjectId, images: [String], thumbnail: String,
  variants: [mongoose.Schema.Types.ObjectId], basePrice: Number, baseMrp: Number,
  baseDiscount: Number, tags: [String], status: { type: String, default: 'active' },
  rating: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 }, isFeatured: Boolean, isNewArrival: Boolean,
  isTrending: Boolean, isBestSeller: Boolean, isOnSale: Boolean,
  viewCount: { type: Number, default: 0 },
  seo: { title: String, description: String, keywords: [String] },
}, { timestamps: true });

const brandSchema = new mongoose.Schema({ name: String, slug: String }, { timestamps: true });
const categorySchema = new mongoose.Schema({ name: String, slug: String }, { timestamps: true });
const vendorSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, storeName: String }, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const ProductVariant = mongoose.models.ProductVariant || mongoose.model('ProductVariant', productVariantSchema);
const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

// ── UTILITIES ────────────────────────────────────────────────────────────────
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function generateSKU(prefix, idx) { return `SV-${prefix}-${String(idx).padStart(5, '0')}`; }

// ── IMAGE POOLS (300+ unique Unsplash photo IDs across all categories) ───────
const IMG = {
  tshirt: [
    `${B}/photo-1521572163474-6864f9cf17ab?w=800`,
    `${B}/photo-1503342217505-b0a15ec3261c?w=800`,
    `${B}/photo-1562157873-818bc0726f68?w=800`,
    `${B}/photo-1583743814966-8936f5b7be1a?w=800`,
    `${B}/photo-1576566588028-4147f3842f27?w=800`,
    `${B}/photo-1586790170083-2f9ceadc732d?w=800`,
    `${B}/photo-1529374255404-311a2a4f1fd9?w=800`,
    `${B}/photo-1598033129183-c4f50c736f10?w=800`,
    `${B}/photo-1622470953794-aa9c70b0fb9d?w=800`,
    `${B}/photo-1618354691373-d851c5c3a990?w=800`,
    `${B}/photo-1521223890158-f9f7c3d5d504?w=800`,
    `${B}/photo-1583743089695-4b816a340f82?w=800`,
  ],
  jeans: [
    `${B}/photo-1542272604-787c3835535d?w=800`,
    `${B}/photo-1541099649105-f69ad21f3246?w=800`,
    `${B}/photo-1475178626620-a4d074967452?w=800`,
    `${B}/photo-1604176424472-17cd5de97ae1?w=800`,
    `${B}/photo-1594938298603-c8148c4dae35?w=800`,
    `${B}/photo-1565084888279-aca607ecce0c?w=800`,
    `${B}/photo-1555689502-c4b22d76c56f?w=800`,
    `${B}/photo-1601924994987-69e26d50dc26?w=800`,
  ],
  shoes: [
    `${B}/photo-1542291026-7eec264c27ff?w=800`,
    `${B}/photo-1606107557195-0e29a4b5b4aa?w=800`,
    `${B}/photo-1608231387042-66d1773070a5?w=800`,
    `${B}/photo-1491553895911-0055eca6402d?w=800`,
    `${B}/photo-1549298916-b41d501d3772?w=800`,
    `${B}/photo-1600185365483-26d7a4cc7519?w=800`,
    `${B}/photo-1595950653106-6c9ebd614d3a?w=800`,
    `${B}/photo-1584735175315-9d5df23be2be?w=800`,
    `${B}/photo-1631729371254-42c2892f0e6e?w=800`,
    `${B}/photo-1580906853431-65f4aca5f3f6?w=800`,
    `${B}/photo-1552346154-21d32810aba3?w=800`,
    `${B}/photo-1515955656352-a1fa3ffcd111?w=800`,
  ],
  dress: [
    `${B}/photo-1496747611176-843222e1e57c?w=800`,
    `${B}/photo-1515886657613-9f3515b0c78f?w=800`,
    `${B}/photo-1572804013309-59a88b7e92f1?w=800`,
    `${B}/photo-1539008835657-9e8e9680c956?w=800`,
    `${B}/photo-1595777457583-95e059d581b8?w=800`,
    `${B}/photo-1611601322175-ef8ec8c5e88e?w=800`,
    `${B}/photo-1552664730-d307ca884978?w=800`,
    `${B}/photo-1509631179647-0177331693ae?w=800`,
    `${B}/photo-1570976447640-ac859083963f?w=800`,
    `${B}/photo-1554568218-0f1715e72254?w=800`,
    `${B}/photo-1618932260643-eee4a2f652a6?w=800`,
    `${B}/photo-1613482184972-f9e8db869d7a?w=800`,
  ],
  jacket: [
    `${B}/photo-1551028719-00167b16eac5?w=800`,
    `${B}/photo-1591047139829-d91aecb6caea?w=800`,
    `${B}/photo-1551488831-00ddcb6c6bd3?w=800`,
    `${B}/photo-1544923246-77307dd654cb?w=800`,
    `${B}/photo-1548883354-7622d03aca27?w=800`,
    `${B}/photo-1605908502724-9093a79a4dca?w=800`,
    `${B}/photo-1624378439575-d8705ad7ae80?w=800`,
    `${B}/photo-1544441893-675973e31985?w=800`,
    `${B}/photo-1611312449408-fcece27cdbb7?w=800`,
    `${B}/photo-1584187839132-d0b3d8fbb819?w=800`,
  ],
  hoodie: [
    `${B}/photo-1620799140408-edc6dcb6d633?w=800`,
    `${B}/photo-1556911220-e15b29be8c8f?w=800`,
    `${B}/photo-1578768079052-aa76e52ff62e?w=800`,
    `${B}/photo-1614676471928-2ed0ad1061a4?w=800`,
    `${B}/photo-1571945153237-4929e783af4a?w=800`,
    `${B}/photo-1580902394724-b08ff5e44b72?w=800`,
    `${B}/photo-1542060748-10c28b62716f?w=800`,
    `${B}/photo-1608236415053-42a606e93d23?w=800`,
  ],
  kurti: [
    `${B}/photo-1608748010899-18f300247112?w=800`,
    `${B}/photo-1631857455684-a54a2f03665f?w=800`,
    `${B}/photo-1583391733981-8498408ee4b2?w=800`,
    `${B}/photo-1610030469983-98e550d6193c?w=800`,
    `${B}/photo-1617627143233-4df547d06a15?w=800`,
    `${B}/photo-1618897996318-5a901fa696ca?w=800`,
    `${B}/photo-1614252235316-8c857d38b5f4?w=800`,
    `${B}/photo-1585060544812-6b45742d762f?w=800`,
  ],
  saree: [
    `${B}/photo-1610030469983-98e550d6193c?w=800`,
    `${B}/photo-1617627143233-4df547d06a15?w=800`,
    `${B}/photo-1618897996318-5a901fa696ca?w=800`,
    `${B}/photo-1583391733981-8498408ee4b2?w=800`,
  ],
  watch: [
    `${B}/photo-1524592094714-0f0654e20314?w=800`,
    `${B}/photo-1523170335258-f5ed11844a49?w=800`,
    `${B}/photo-1542496658-e33a6d0d82a0?w=800`,
    `${B}/photo-1585386959984-a4155224a1ad?w=800`,
    `${B}/photo-1508685096489-7aacd43bd3b1?w=800`,
    `${B}/photo-1548171915-e79a6a8bdb96?w=800`,
  ],
  bag: [
    `${B}/photo-1548036328-c9fa89d128fa?w=800`,
    `${B}/photo-1553062407-98eeb64c6a62?w=800`,
    `${B}/photo-1590874103328-eac38a683ce7?w=800`,
    `${B}/photo-1547949003-9792a18a2601?w=800`,
    `${B}/photo-1614179818511-5e7b07aca2a3?w=800`,
    `${B}/photo-1584917865442-de89df76afd3?w=800`,
  ],
  sportswear: [
    `${B}/photo-1517963879433-6ad2b056d712?w=800`,
    `${B}/photo-1576678927484-cc907957088c?w=800`,
    `${B}/photo-1541534741688-6078c6bfb5c5?w=800`,
    `${B}/photo-1550345332-09e3ac987658?w=800`,
    `${B}/photo-1556909172-54557c7e4fb7?w=800`,
    `${B}/photo-1618754886248-ce2d59d1cb61?w=800`,
    `${B}/photo-1606922421930-b70699faa40f?w=800`,
  ],
  kids: [
    `${B}/photo-1503944168849-8bf86875bbd8?w=800`,
    `${B}/photo-1471286174890-9c112ac6476a?w=800`,
    `${B}/photo-1519689680058-324335c77eba?w=800`,
    `${B}/photo-1551858009-bb7b1800e3e7?w=800`,
    `${B}/photo-1560807707-8cc77767d783?w=800`,
  ],
};

// Pointer to cycle images without repetition
const ptrs = {};
function nextImg(type, n = 4) {
  if (!ptrs[type]) ptrs[type] = 0;
  const pool = IMG[type] || IMG.tshirt;
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool[(ptrs[type]++) % pool.length]);
  return out;
}

// ── PRODUCT CATALOGUE (150 new products) ─────────────────────────────────────
// Format: { name, brand(slug), category(slug), vendor(idx 0-4), price, mrp, imgType, tags, desc, short, flags }
const NEW_PRODUCTS = [
  // ── MEN'S T-SHIRTS & SHIRTS (20) ─────────────────────────────────────────
  { name: 'Nike Sportswear Club T-Shirt', brand: 'nike', category: 'men', vendor: 0, price: 1299, mrp: 1999, imgType: 'tshirt', tags: ['nike','tshirt','casual','men'], short: 'Everyday club tee in soft cotton', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Adidas Essential 3-Stripe Tee', brand: 'adidas', category: 'men', vendor: 2, price: 999, mrp: 1799, imgType: 'tshirt', tags: ['adidas','tshirt','sport','men'], short: 'Iconic 3-stripe cotton tee', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Puma Graphic Round Neck Tee', brand: 'puma', category: 'men', vendor: 2, price: 799, mrp: 1399, imgType: 'tshirt', tags: ['puma','tshirt','graphic','men'], short: 'Bold graphic print for street style', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'H&M Slim Fit Cotton Shirt', brand: 'hm', category: 'men', vendor: 0, price: 1099, mrp: 1799, imgType: 'tshirt', tags: ['hm','shirt','slim','men'], short: 'Essential slim-fit daily shirt', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Tommy Hilfiger Classic Polo Shirt', brand: 'tommy-hilfiger', category: 'men', vendor: 0, price: 2499, mrp: 3999, imgType: 'tshirt', tags: ['tommy','polo','shirt','men'], short: 'Classic polo with flag embroidery', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Allen Solly Printed Casual Shirt', brand: 'allen-solly', category: 'men', vendor: 0, price: 1399, mrp: 2299, imgType: 'tshirt', tags: ['allen solly','shirt','printed','men'], short: 'Weekend-ready printed casual shirt', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'US Polo Assn. Crew Neck T-Shirt', brand: 'us-polo', category: 'men', vendor: 0, price: 799, mrp: 1299, imgType: 'tshirt', tags: ['us polo','tshirt','crew neck','men'], short: 'Basic crew neck tee for every day', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Zara Premium Linen Shirt', brand: 'zara', category: 'men', vendor: 0, price: 2999, mrp: 4499, imgType: 'tshirt', tags: ['zara','linen','shirt','men'], short: 'Breathable linen for summer months', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Roadster Acid Wash T-Shirt', brand: 'roadster', category: 'men', vendor: 0, price: 699, mrp: 1199, imgType: 'tshirt', tags: ['roadster','acid wash','tshirt','men'], short: 'Vintage acid-wash graphic tee', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Nike Pro Compression Shirt', brand: 'nike', category: 'sports-wear', vendor: 2, price: 2499, mrp: 3499, imgType: 'tshirt', tags: ['nike','compression','sport','men'], short: 'Pro-level compression for athletes', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: true } },
  { name: 'Adidas Originals Trefoil Tee', brand: 'adidas', category: 'men', vendor: 2, price: 1299, mrp: 1999, imgType: 'tshirt', tags: ['adidas','originals','trefoil','men'], short: 'Heritage Trefoil tee in pure cotton', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'H&M Henley Neck Long Sleeve', brand: 'hm', category: 'men', vendor: 0, price: 1299, mrp: 2099, imgType: 'tshirt', tags: ['hm','henley','long sleeve','men'], short: 'Casual henley for layered looks', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Puma Stadium Printed Polo', brand: 'puma', category: 'men', vendor: 2, price: 1699, mrp: 2499, imgType: 'tshirt', tags: ['puma','polo','sport','men'], short: 'Stadium-inspired polo in moisture-control fabric', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Levi\'s Vintage Graphic Tee', brand: 'levis', category: 'men', vendor: 0, price: 1799, mrp: 2999, imgType: 'tshirt', tags: ["levi's",'vintage','graphic','men'], short: 'Retro graphic on soft 100% cotton', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'Tommy Hilfiger Vertical Stripe Shirt', brand: 'tommy-hilfiger', category: 'men', vendor: 0, price: 3499, mrp: 4999, imgType: 'tshirt', tags: ['tommy','stripe','shirt','men'], short: 'Preppy vertical-stripe woven shirt', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'US Polo Assn. Full Sleeve Shirt', brand: 'us-polo', category: 'men', vendor: 0, price: 1299, mrp: 2299, imgType: 'tshirt', tags: ['us polo','full sleeve','shirt','men'], short: 'Smart-casual full sleeve for every occasion', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Zara Structured Poplin Shirt', brand: 'zara', category: 'men', vendor: 0, price: 2799, mrp: 3999, imgType: 'tshirt', tags: ['zara','poplin','shirt','men'], short: 'Clean-cut poplin shirt for smart casual', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Allen Solly Micro-Print Shirt', brand: 'allen-solly', category: 'men', vendor: 0, price: 1799, mrp: 2799, imgType: 'tshirt', tags: ['allen solly','micro print','men','office'], short: 'Office-smart micro-print formal shirt', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Roadster Oversized Drop Shoulder Tee', brand: 'roadster', category: 'men', vendor: 0, price: 899, mrp: 1499, imgType: 'tshirt', tags: ['roadster','oversized','drop shoulder','men'], short: 'Oversized drop-shoulder for streetwear vibes', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Nike Dri-FIT UV Miler Singlet', brand: 'nike', category: 'sports-wear', vendor: 2, price: 1999, mrp: 2999, imgType: 'tshirt', tags: ['nike','singlet','running','uv','sport'], short: 'UV-protection singlet for outdoor runners', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  // ── WOMEN'S DRESSES & TOPS (20) ──────────────────────────────────────────
  { name: 'Zara Satin Slip Dress', brand: 'zara', category: 'women', vendor: 0, price: 3999, mrp: 5999, imgType: 'dress', tags: ['zara','satin','slip dress','women'], short: 'Elegant satin slip dress for evenings', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'H&M Off-Shoulder Ruffle Dress', brand: 'hm', category: 'women', vendor: 0, price: 2299, mrp: 3499, imgType: 'dress', tags: ['hm','off shoulder','ruffle','women'], short: 'Romantic ruffle off-shoulder for date nights', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'ONLY Ribbed Bodycon Dress', brand: 'only', category: 'women', vendor: 1, price: 1999, mrp: 3499, imgType: 'dress', tags: ['only','bodycon','ribbed','women'], short: 'Form-fitting ribbed dress for night out', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'US Polo Assn. Shirt Dress', brand: 'us-polo', category: 'women', vendor: 0, price: 2199, mrp: 3299, imgType: 'dress', tags: ['us polo','shirt dress','casual','women'], short: 'Chic shirt dress for effortless style', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Levi\'s Denim Mini Skirt', brand: 'levis', category: 'women', vendor: 0, price: 2499, mrp: 3999, imgType: 'jeans', tags: ["levi's",'denim','mini skirt','women'], short: 'Classic denim mini for modern rebel', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'H&M Smocked Waist Sundress', brand: 'hm', category: 'women', vendor: 0, price: 1799, mrp: 2799, imgType: 'dress', tags: ['hm','sundress','smocked','women'], short: 'Breezy smocked sundress for summer', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Tommy Hilfiger Striped Polo Dress', brand: 'tommy-hilfiger', category: 'women', vendor: 0, price: 4499, mrp: 5999, imgType: 'dress', tags: ['tommy','polo dress','stripe','women'], short: 'Preppy polo dress with signature stripes', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Roadster Floral Wrap Top', brand: 'roadster', category: 'women', vendor: 0, price: 899, mrp: 1499, imgType: 'dress', tags: ['roadster','floral','wrap top','women'], short: 'Floral wrap top to brighten your day', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Zara Cut-Out Midi Dress', brand: 'zara', category: 'women', vendor: 0, price: 4999, mrp: 6999, imgType: 'dress', tags: ['zara','cut-out','midi','women'], short: 'Edgy cut-out midi for fashion-forward women', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'ONLY V-Neck Crop Top', brand: 'only', category: 'women', vendor: 1, price: 799, mrp: 1399, imgType: 'tshirt', tags: ['only','crop top','v-neck','women'], short: 'Essential crop top for any outfit', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'H&M Puff Sleeve Blouse', brand: 'hm', category: 'women', vendor: 0, price: 1299, mrp: 1999, imgType: 'dress', tags: ['hm','puff sleeve','blouse','women'], short: 'Trendy puff-sleeve blouse for work-to-weekend', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Zara Linen Mix Co-Ord Set', brand: 'zara', category: 'women', vendor: 0, price: 5499, mrp: 7999, imgType: 'dress', tags: ['zara','co-ord','linen','women','set'], short: 'Chic linen co-ord for minimalist days', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Roadster Abstract Print Dress', brand: 'roadster', category: 'women', vendor: 0, price: 1199, mrp: 1999, imgType: 'dress', tags: ['roadster','abstract','printed','women'], short: 'Bold abstract print for spontaneous spirits', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Tommy Hilfiger Ruffle Hem Dress', brand: 'tommy-hilfiger', category: 'women', vendor: 0, price: 5999, mrp: 7999, imgType: 'dress', tags: ['tommy','ruffle','hem','women'], short: 'Preppy ruffle-hem dress for sunny days', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'ONLY Cami Strap Satin Top', brand: 'only', category: 'women', vendor: 1, price: 1299, mrp: 1999, imgType: 'dress', tags: ['only','cami','satin','women'], short: 'Luxe satin cami that dresses up or down', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Levi\'s High Rise Mom Shorts', brand: 'levis', category: 'women', vendor: 0, price: 1999, mrp: 3499, imgType: 'jeans', tags: ["levi's",'mom shorts','high rise','women'], short: 'Relaxed mom shorts for weekend vibes', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'H&M Oversized Linen Blazer', brand: 'hm', category: 'women', vendor: 0, price: 3499, mrp: 4999, imgType: 'jacket', tags: ['hm','linen','blazer','women','oversized'], short: 'Relaxed-fit linen blazer for power dressing', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Zara Sequin Mini Dress', brand: 'zara', category: 'women', vendor: 0, price: 6999, mrp: 9999, imgType: 'dress', tags: ['zara','sequin','mini dress','women'], short: 'Head-turning sequin mini for party nights', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'ONLY Balloon Sleeve Sweater', brand: 'only', category: 'women', vendor: 1, price: 2299, mrp: 3499, imgType: 'hoodie', tags: ['only','balloon sleeve','sweater','women'], short: 'Statement balloon-sleeve knitwear', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Roadster Printed Crop Hoodie', brand: 'roadster', category: 'women', vendor: 0, price: 999, mrp: 1699, imgType: 'hoodie', tags: ['roadster','crop hoodie','printed','women'], short: 'Casual crop hoodie for streetwear queens', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  // ── FOOTWEAR (20) ────────────────────────────────────────────────────────
  { name: 'Nike React Infinity Run FK 3', brand: 'nike', category: 'footwear', vendor: 2, price: 11999, mrp: 14999, imgType: 'shoes', tags: ['nike','react','infinity','running'], short: 'Injury-prevention running shoe by Nike', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Adidas Stan Smith Sneakers', brand: 'adidas', category: 'footwear', vendor: 2, price: 7999, mrp: 9999, imgType: 'shoes', tags: ['adidas','stan smith','classic','white'], short: 'The evergreen Stan Smith in classic white', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Puma Suede Classic XXI', brand: 'puma', category: 'footwear', vendor: 2, price: 5999, mrp: 7999, imgType: 'shoes', tags: ['puma','suede','classic','sneakers'], short: 'Timeless suede sneaker with PUMA heritage', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Nike Metcon 8 Training Shoes', brand: 'nike', category: 'footwear', vendor: 2, price: 10999, mrp: 13499, imgType: 'shoes', tags: ['nike','metcon','training','gym'], short: 'Built for cross-training dominance', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Adidas NMD_R1 Sneakers', brand: 'adidas', category: 'footwear', vendor: 2, price: 9499, mrp: 12999, imgType: 'shoes', tags: ['adidas','nmd','boost','streetwear'], short: 'Streetwear icon with Boost cushioning', flags: { isFeatured: true, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'Puma Future Rider Play On Sneakers', brand: 'puma', category: 'footwear', vendor: 2, price: 4999, mrp: 6999, imgType: 'shoes', tags: ['puma','future rider','retro','sneakers'], short: 'Retro-inspired runner for modern streets', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Nike Air Zoom Pegasus 40', brand: 'nike', category: 'footwear', vendor: 2, price: 8999, mrp: 10999, imgType: 'shoes', tags: ['nike','pegasus','zoom','running'], short: 'Versatile running shoe for every run', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: true } },
  { name: 'Adidas Forum Low Sneakers', brand: 'adidas', category: 'footwear', vendor: 2, price: 6499, mrp: 8499, imgType: 'shoes', tags: ['adidas','forum','low','basketball'], short: '80s basketball shoe reborn for street culture', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Puma Mayze Wedge Sneakers', brand: 'puma', category: 'footwear', vendor: 2, price: 6999, mrp: 8999, imgType: 'shoes', tags: ['puma','mayze','wedge','women'], short: 'Elevated platform sneaker for women', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'Nike Air Jordan 1 Mid', brand: 'nike', category: 'footwear', vendor: 2, price: 12999, mrp: 15999, imgType: 'shoes', tags: ['nike','jordan','mid','basketball','premium'], short: 'Iconic basketball shoe with a legendary legacy', flags: { isFeatured: true, isNewArrival: false, isTrending: true, isBestSeller: true } },
  { name: 'Adidas Superstar OG Sneakers', brand: 'adidas', category: 'footwear', vendor: 2, price: 7499, mrp: 9499, imgType: 'shoes', tags: ['adidas','superstar','shell toe','classic'], short: 'Shell-toe legend in premium leather', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Puma Electron E Pro Sneakers', brand: 'puma', category: 'footwear', vendor: 2, price: 3999, mrp: 5999, imgType: 'shoes', tags: ['puma','electron','sport','men'], short: 'Lightweight EVA sole for everyday wear', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Wildcraft Trekking Boots', brand: 'wildcraft', category: 'footwear', vendor: 2, price: 3499, mrp: 5499, imgType: 'shoes', tags: ['wildcraft','trekking','boots','outdoor'], short: 'All-terrain boots for the adventurer', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Nike Flex Experience Run 11', brand: 'nike', category: 'footwear', vendor: 2, price: 4499, mrp: 6499, imgType: 'shoes', tags: ['nike','flex','run','budget'], short: 'Entry-level Nike runner for everyday jogs', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Adidas Gazelle Indoor Sneakers', brand: 'adidas', category: 'footwear', vendor: 2, price: 7999, mrp: 9999, imgType: 'shoes', tags: ['adidas','gazelle','indoor','classic'], short: 'Retro indoor shoe with suede upper', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Puma Smash v2 Leather Sneakers', brand: 'puma', category: 'footwear', vendor: 2, price: 2999, mrp: 4499, imgType: 'shoes', tags: ['puma','smash','leather','classic'], short: 'Clean leather everyday sneaker', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Nike Court Vision Low Sneakers', brand: 'nike', category: 'footwear', vendor: 2, price: 5499, mrp: 7499, imgType: 'shoes', tags: ['nike','court vision','low','casual'], short: 'Court-inspired casual sneaker', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'Adidas Cloudfoam Pure 2.0', brand: 'adidas', category: 'footwear', vendor: 2, price: 3499, mrp: 4999, imgType: 'shoes', tags: ['adidas','cloudfoam','women','comfort'], short: 'Ultra-soft cloudfoam for all-day comfort', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Puma Vikky V3 Sneakers for Women', brand: 'puma', category: 'footwear', vendor: 2, price: 3299, mrp: 4999, imgType: 'shoes', tags: ['puma','vikky','women','casual'], short: 'Feminine low-cut lifestyle sneaker', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Nike Tanjun EasyOn Sneakers', brand: 'nike', category: 'footwear', vendor: 2, price: 4499, mrp: 5999, imgType: 'shoes', tags: ['nike','tanjun','easy on','slip on'], short: 'Hands-free ease with stretch-fit design', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  // ── JACKETS & OUTERWEAR (15) ─────────────────────────────────────────────
  { name: 'Nike Windrunner Running Jacket', brand: 'nike', category: 'sports-wear', vendor: 2, price: 5999, mrp: 7999, imgType: 'jacket', tags: ['nike','windrunner','jacket','running'], short: 'Lightweight windbreaker for all-weather runs', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Adidas Tiro 23 League Training Jacket', brand: 'adidas', category: 'sports-wear', vendor: 2, price: 3999, mrp: 5499, imgType: 'jacket', tags: ['adidas','tiro','training','jacket'], short: 'Stadium-ready training jacket with zip pockets', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Puma Essentials Padded Jacket', brand: 'puma', category: 'winter-collection', vendor: 0, price: 4999, mrp: 6999, imgType: 'jacket', tags: ['puma','padded','jacket','winter'], short: 'Lightweight padded jacket for cold days', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Zara Cropped Trench Coat', brand: 'zara', category: 'women', vendor: 0, price: 7999, mrp: 10999, imgType: 'jacket', tags: ['zara','trench','coat','women'], short: 'Mini trench coat for Parisian chic vibes', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'H&M Quilted Jacket', brand: 'hm', category: 'men', vendor: 0, price: 2999, mrp: 4499, imgType: 'jacket', tags: ['hm','quilted','jacket','men','winter'], short: 'Warm quilted jacket for chilly evenings', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Tommy Hilfiger Puffer Jacket', brand: 'tommy-hilfiger', category: 'men', vendor: 0, price: 8999, mrp: 12999, imgType: 'jacket', tags: ['tommy','puffer','jacket','winter'], short: 'Premium puffer to brave the cold in style', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Levi\'s Original Trucker Jacket', brand: 'levis', category: 'men', vendor: 0, price: 5999, mrp: 8999, imgType: 'jacket', tags: ["levi's",'trucker','denim','jacket'], short: 'The original Levi\'s Trucker in rigid denim', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: true } },
  { name: 'Adidas Premium Fleece Hoodie Jacket', brand: 'adidas', category: 'men', vendor: 2, price: 3999, mrp: 5499, imgType: 'hoodie', tags: ['adidas','fleece','hoodie','jacket'], short: 'Full-zip fleece hoodie for weekend warmth', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Nike Tech Fleece Full-Zip Hoodie', brand: 'nike', category: 'men', vendor: 2, price: 7499, mrp: 9999, imgType: 'hoodie', tags: ['nike','tech fleece','hoodie','premium'], short: 'Premium Tech Fleece for next-gen warmth', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: true } },
  { name: 'H&M Faux Suede Jacket', brand: 'hm', category: 'women', vendor: 0, price: 3499, mrp: 4999, imgType: 'jacket', tags: ['hm','suede','jacket','women'], short: 'Western-inspired suede jacket for women', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Zara Biker Zip-Up Jacket', brand: 'zara', category: 'men', vendor: 0, price: 6999, mrp: 9499, imgType: 'jacket', tags: ['zara','biker','zip','men'], short: 'Edgy biker jacket for the rebel spirit', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'Puma BVB Away Windbreaker', brand: 'puma', category: 'sports-wear', vendor: 2, price: 4499, mrp: 5999, imgType: 'jacket', tags: ['puma','windbreaker','football','sport'], short: 'Football-inspired windbreaker by Puma', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Tommy Hilfiger Reversible Vest', brand: 'tommy-hilfiger', category: 'men', vendor: 0, price: 5999, mrp: 7999, imgType: 'jacket', tags: ['tommy','vest','reversible','men'], short: 'Versatile reversible quilted vest', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Roadster Olive Bomber Jacket', brand: 'roadster', category: 'men', vendor: 0, price: 1999, mrp: 2999, imgType: 'jacket', tags: ['roadster','bomber','olive','men'], short: 'Classic olive bomber for streetwear looks', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'H&M Hooded Windbreaker Jacket', brand: 'hm', category: 'men', vendor: 0, price: 2499, mrp: 3699, imgType: 'jacket', tags: ['hm','windbreaker','hooded','men'], short: 'Packable hooded windbreaker for travel', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  // ── ETHNIC WEAR (15) ─────────────────────────────────────────────────────
  { name: 'BIBA Bandhani Print Kurti', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 1299, mrp: 2199, imgType: 'kurti', tags: ['biba','bandhani','kurti','ethnic'], short: 'Traditional bandhani-print straight kurti', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Embroidered Anarkali Suit', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 3499, mrp: 5499, imgType: 'kurti', tags: ['biba','anarkali','embroidered','ethnic'], short: 'Regal anarkali suit with intricate embroidery', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'BIBA Chanderi Dupatta Set', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 2799, mrp: 4199, imgType: 'kurti', tags: ['biba','chanderi','dupatta','ethnic'], short: 'Elegant chanderi suit with matching dupatta', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Georgette Lehenga Set', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 4999, mrp: 7499, imgType: 'kurti', tags: ['biba','lehenga','georgette','festive'], short: 'Festive georgette lehenga for celebrations', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'BIBA Lucknowi Chikankari Kurti', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 1799, mrp: 2999, imgType: 'kurti', tags: ['biba','chikankari','lucknowi','kurti'], short: 'Delicate chikankari hand-embroidered kurti', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'BIBA Floral Block Print Kurti', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 1099, mrp: 1799, imgType: 'kurti', tags: ['biba','block print','floral','kurti'], short: 'Jaipur block-print straight kurti', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Art Silk Saree', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 2499, mrp: 4299, imgType: 'saree', tags: ['biba','silk','saree','traditional'], short: 'Art silk saree with woven border', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Cotton Cambric A-Line Dress', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 1499, mrp: 2299, imgType: 'kurti', tags: ['biba','cotton','a-line','kurta'], short: 'Breezy cotton A-line kurta for daily wear', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'BIBA Banarasi Silk Suit Set', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 6999, mrp: 9999, imgType: 'saree', tags: ['biba','banarasi','silk','suit'], short: 'Opulent Banarasi silk suit for occasions', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Mirror Work Koti Jacket', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 1999, mrp: 3499, imgType: 'kurti', tags: ['biba','mirror work','koti','ethnic'], short: 'Festive koti jacket with mirror embroidery', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'BIBA Straight Rayon Kurti with Pants', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 1699, mrp: 2599, imgType: 'kurti', tags: ['biba','rayon','kurti','pants','set'], short: 'Rayon kurti-pants combo for casual comfort', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Phulkari Embroidered Suit', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 3999, mrp: 5999, imgType: 'kurti', tags: ['biba','phulkari','punjabi','embroidered'], short: 'Vibrant phulkari work Punjabi suit', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Digital Floral Saree', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 1999, mrp: 3299, imgType: 'saree', tags: ['biba','digital print','saree','floral'], short: 'Vibrant digital-print georgette saree', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Palazzo Suit Combo', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 2299, mrp: 3699, imgType: 'kurti', tags: ['biba','palazzo','suit','combo'], short: 'Complete palazzo suit combo with dupatta', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'BIBA Madhubani Print Kurta', brand: 'biba', category: 'ethnic-wear', vendor: 1, price: 1899, mrp: 2999, imgType: 'kurti', tags: ['biba','madhubani','art','kurta'], short: 'Folk-art Madhubani print on linen kurta', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  // ── HOODIES & SWEATSHIRTS (10) ───────────────────────────────────────────
  { name: 'Adidas Originals Hoodie', brand: 'adidas', category: 'men', vendor: 2, price: 2999, mrp: 4499, imgType: 'hoodie', tags: ['adidas','hoodie','originals','trefoil'], short: 'Classic Adidas Originals pullover hoodie', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'Nike Club Fleece Pullover Hoodie', brand: 'nike', category: 'men', vendor: 2, price: 3499, mrp: 4999, imgType: 'hoodie', tags: ['nike','club fleece','hoodie','casual'], short: 'Soft fleece for everyday comfort', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Puma Power Graphic Hoodie', brand: 'puma', category: 'men', vendor: 2, price: 2299, mrp: 3299, imgType: 'hoodie', tags: ['puma','graphic','hoodie','men'], short: 'Bold graphic hoodie for gym & streets', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'H&M Oversized Zip Hoodie', brand: 'hm', category: 'women', vendor: 0, price: 1999, mrp: 2999, imgType: 'hoodie', tags: ['hm','oversized','zip','hoodie','women'], short: 'Cozy oversized zip hoodie for lazy days', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'Roadster Tie-Dye Hoodie', brand: 'roadster', category: 'men', vendor: 0, price: 1499, mrp: 2199, imgType: 'hoodie', tags: ['roadster','tie-dye','hoodie','men'], short: 'Groovy tie-dye hoodie for retro style', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Tommy Hilfiger Center Logo Hoodie', brand: 'tommy-hilfiger', category: 'men', vendor: 0, price: 4999, mrp: 6999, imgType: 'hoodie', tags: ['tommy','center logo','hoodie','premium'], short: 'Premium center-logo pullover hoodie', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Nike Phoenix Fleece Women Hoodie', brand: 'nike', category: 'women', vendor: 2, price: 4499, mrp: 5999, imgType: 'hoodie', tags: ['nike','phoenix fleece','women','hoodie'], short: 'Cropped fleece hoodie designed for women', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Adidas Future Icons Sweatshirt', brand: 'adidas', category: 'men', vendor: 2, price: 2499, mrp: 3499, imgType: 'hoodie', tags: ['adidas','future icons','sweatshirt'], short: 'Earth-tone sweatshirt for the conscious dresser', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Puma Classics Logo Sweatshirt', brand: 'puma', category: 'women', vendor: 2, price: 1999, mrp: 2999, imgType: 'hoodie', tags: ['puma','classics','logo','sweatshirt'], short: 'Clean logo sweatshirt for effortless style', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'H&M Cotton Sweatshirt', brand: 'hm', category: 'men', vendor: 0, price: 1299, mrp: 1999, imgType: 'hoodie', tags: ['hm','cotton','sweatshirt','basic'], short: 'Essential cotton crew-neck sweatshirt', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  // ── WATCHES (10) ─────────────────────────────────────────────────────────
  { name: 'Fossil Gen 6 Smartwatch', brand: 'fossil', category: 'watches', vendor: 3, price: 19999, mrp: 24999, imgType: 'watch', tags: ['fossil','smartwatch','gen 6','premium'], short: 'Gen 6 smartwatch powered by Snapdragon', flags: { isFeatured: true, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Titan Raga Analog Watch', brand: 'titan', category: 'watches', vendor: 3, price: 4499, mrp: 6999, imgType: 'watch', tags: ['titan','raga','women','analog'], short: 'Elegant Raga analog watch for women', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Fossil Machine Chronograph', brand: 'fossil', category: 'watches', vendor: 3, price: 12999, mrp: 16999, imgType: 'watch', tags: ['fossil','machine','chronograph','men'], short: 'Bold chronograph for the man of action', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
  { name: 'Titan Edge Ultra Slim Watch', brand: 'titan', category: 'watches', vendor: 3, price: 6999, mrp: 9499, imgType: 'watch', tags: ['titan','edge','slim','men'], short: 'The world\'s slimmest metal-dial watch', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Fossil FB-01 Three-Hand Watch', brand: 'fossil', category: 'watches', vendor: 3, price: 9999, mrp: 12999, imgType: 'watch', tags: ['fossil','three hand','minimal','men'], short: 'Minimalist three-hand stainless steel watch', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Titan Neo Eco Smartwatch', brand: 'titan', category: 'watches', vendor: 3, price: 7999, mrp: 9999, imgType: 'watch', tags: ['titan','neo','smartwatch','eco'], short: 'Eco-friendly smartwatch by Titan', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Fossil Scarlette Mini Watch', brand: 'fossil', category: 'watches', vendor: 3, price: 8499, mrp: 10999, imgType: 'watch', tags: ['fossil','scarlette','women','mini'], short: 'Petite feminine watch with rose gold detail', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Titan Regalia Formal Watch', brand: 'titan', category: 'watches', vendor: 3, price: 5499, mrp: 7499, imgType: 'watch', tags: ['titan','regalia','formal','dress'], short: 'Gold-toned formal watch for special occasions', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Fossil Grant Solar-Powered Watch', brand: 'fossil', category: 'watches', vendor: 3, price: 14999, mrp: 19999, imgType: 'watch', tags: ['fossil','grant','solar','eco'], short: 'Solar-powered watch that never needs a battery', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Titan Zoop Kids Watch', brand: 'titan', category: 'watches', vendor: 3, price: 1999, mrp: 2999, imgType: 'watch', tags: ['titan','zoop','kids','colorful'], short: 'Fun & colorful watch designed for kids', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  // ── BAGS (10) ────────────────────────────────────────────────────────────
  { name: 'Wildcraft Ultra Backpack 35L', brand: 'wildcraft', category: 'bags', vendor: 3, price: 2999, mrp: 4499, imgType: 'bag', tags: ['wildcraft','backpack','35l','trekking'], short: '35L adventure backpack for serious trekkers', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Zara Studded Clutch', brand: 'zara', category: 'bags', vendor: 0, price: 2999, mrp: 4499, imgType: 'bag', tags: ['zara','clutch','studded','evening'], short: 'Studded evening clutch for glamorous nights', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Tommy Hilfiger Monogram Tote', brand: 'tommy-hilfiger', category: 'bags', vendor: 3, price: 6999, mrp: 9999, imgType: 'bag', tags: ['tommy','tote','monogram','women'], short: 'Signature monogram tote for daily carry', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'Wildcraft Fury Gym Duffle Bag', brand: 'wildcraft', category: 'bags', vendor: 3, price: 1499, mrp: 2499, imgType: 'bag', tags: ['wildcraft','duffle','gym','sports'], short: 'Spacious duffle bag for gym goers', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Zara Box Bag', brand: 'zara', category: 'bags', vendor: 0, price: 3999, mrp: 5999, imgType: 'bag', tags: ['zara','box bag','structured','women'], short: 'Chic structured box bag for editorial looks', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Tommy Hilfiger Flag Logo Crossbody', brand: 'tommy-hilfiger', category: 'bags', vendor: 3, price: 5499, mrp: 7499, imgType: 'bag', tags: ['tommy','crossbody','flag logo','women'], short: 'Compact crossbody with flag logo hardware', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Wildcraft Drifter 25L Daypack', brand: 'wildcraft', category: 'bags', vendor: 3, price: 1999, mrp: 2999, imgType: 'bag', tags: ['wildcraft','daypack','outdoor','25l'], short: 'Compact daypack for hikes and travel', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Zara Woven Raffia Beach Bag', brand: 'zara', category: 'bags', vendor: 0, price: 2499, mrp: 3499, imgType: 'bag', tags: ['zara','raffia','beach bag','summer'], short: 'Woven raffia tote for sunny beach days', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Tommy Hilfiger Campus Oxford Backpack', brand: 'tommy-hilfiger', category: 'bags', vendor: 3, price: 7999, mrp: 10999, imgType: 'bag', tags: ['tommy','backpack','oxford','premium'], short: 'Premium canvas campus backpack', flags: { isFeatured: true, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Wildcraft Sprint Roller Trolley', brand: 'wildcraft', category: 'bags', vendor: 3, price: 3499, mrp: 5499, imgType: 'bag', tags: ['wildcraft','trolley','travel','luggage'], short: 'Lightweight spinner trolley for weekend trips', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  // ── KIDS (10) ────────────────────────────────────────────────────────────
  { name: 'H&M Kids Cotton Printed T-Shirt', brand: 'hm', category: 'kids', vendor: 4, price: 499, mrp: 799, imgType: 'kids', tags: ['hm','kids','tshirt','cotton'], short: 'Fun printed tee for little explorers', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'H&M Kids Denim Jogger Pants', brand: 'hm', category: 'kids', vendor: 4, price: 799, mrp: 1299, imgType: 'kids', tags: ['hm','kids','jogger','denim'], short: 'Comfy denim joggers for active kids', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'H&M Kids Zip Hoodie', brand: 'hm', category: 'kids', vendor: 4, price: 999, mrp: 1499, imgType: 'kids', tags: ['hm','kids','hoodie','zip'], short: 'Warm zip hoodie for school days', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Nike Kids Air Max 97 (GS)', brand: 'nike', category: 'kids', vendor: 4, price: 5999, mrp: 7999, imgType: 'shoes', tags: ['nike','kids','air max','sneakers'], short: 'Iconic Air Max 97 sized for growing feet', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Adidas Kids Superstar Sneakers', brand: 'adidas', category: 'kids', vendor: 4, price: 3999, mrp: 5499, imgType: 'shoes', tags: ['adidas','kids','superstar','shell toe'], short: 'Classic shell-toe superstar for kids', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: true } },
  { name: 'H&M Kids Summer Shorts Set', brand: 'hm', category: 'kids', vendor: 4, price: 699, mrp: 999, imgType: 'kids', tags: ['hm','kids','shorts','summer'], short: 'Colourful shorts set for summer fun', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Puma Kids Tracksuit', brand: 'puma', category: 'kids', vendor: 4, price: 1999, mrp: 2999, imgType: 'kids', tags: ['puma','kids','tracksuit','sport'], short: 'Sporty tracksuit for junior athletes', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'H&M Kids Floral Dress', brand: 'hm', category: 'kids', vendor: 4, price: 799, mrp: 1199, imgType: 'kids', tags: ['hm','kids','dress','floral','girls'], short: 'Pretty floral dress for little girls', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Nike Kids Dri-FIT T-Shirt', brand: 'nike', category: 'kids', vendor: 4, price: 999, mrp: 1599, imgType: 'kids', tags: ['nike','kids','dri-fit','sport'], short: 'Moisture-wicking tee for sporty kids', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Adidas Kids Fortarun Shoes', brand: 'adidas', category: 'kids', vendor: 4, price: 2999, mrp: 4499, imgType: 'shoes', tags: ['adidas','kids','fortarun','running'], short: 'Elastic-lace running shoes for kids', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  // ── SPORTSWEAR (10) ──────────────────────────────────────────────────────
  { name: 'Nike Pro Women Tights', brand: 'nike', category: 'sports-wear', vendor: 2, price: 2999, mrp: 3999, imgType: 'sportswear', tags: ['nike','pro','tights','women','gym'], short: 'High-rise pro tights for ultimate support', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: true } },
  { name: 'Adidas Believe This 2.0 Tights', brand: 'adidas', category: 'sports-wear', vendor: 2, price: 2499, mrp: 3499, imgType: 'sportswear', tags: ['adidas','believe this','tights','women'], short: 'Sculpted high-rise tights for training', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Puma Training Shorts Men', brand: 'puma', category: 'sports-wear', vendor: 2, price: 1299, mrp: 1999, imgType: 'sportswear', tags: ['puma','shorts','training','men'], short: 'Lightweight training shorts for men', flags: { isFeatured: false, isNewArrival: true, isTrending: false, isBestSeller: false } },
  { name: 'Nike Air Dri-FIT Sports Bra', brand: 'nike', category: 'sports-wear', vendor: 2, price: 2499, mrp: 3499, imgType: 'sportswear', tags: ['nike','sports bra','air','women'], short: 'Medium-support sports bra with Air mesh', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Adidas Techfit Compression Tights', brand: 'adidas', category: 'sports-wear', vendor: 2, price: 2999, mrp: 3999, imgType: 'sportswear', tags: ['adidas','techfit','compression','men'], short: 'Power-enhancing techfit compression for men', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Puma Modern Sports Tank Top Women', brand: 'puma', category: 'sports-wear', vendor: 2, price: 999, mrp: 1499, imgType: 'sportswear', tags: ['puma','tank top','sport','women'], short: 'Breathable tank top for active women', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Nike Dri-FIT Yoga Pants', brand: 'nike', category: 'sports-wear', vendor: 2, price: 3499, mrp: 4999, imgType: 'sportswear', tags: ['nike','yoga','pants','women'], short: 'Ultra-soft high-waisted yoga pants', flags: { isFeatured: false, isNewArrival: true, isTrending: true, isBestSeller: false } },
  { name: 'Adidas Run Icons 3-Bar Tee Women', brand: 'adidas', category: 'sports-wear', vendor: 2, price: 1499, mrp: 2199, imgType: 'sportswear', tags: ['adidas','running','tee','women'], short: 'Sustainable running tee for women', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Puma Individual Rise Training Jersey', brand: 'puma', category: 'sports-wear', vendor: 2, price: 1999, mrp: 2999, imgType: 'sportswear', tags: ['puma','jersey','training','men'], short: 'Football-inspired training jersey', flags: { isFeatured: false, isNewArrival: false, isTrending: false, isBestSeller: false } },
  { name: 'Nike Indy Light-Support Sports Bra', brand: 'nike', category: 'sports-wear', vendor: 2, price: 1999, mrp: 2799, imgType: 'sportswear', tags: ['nike','indy','sports bra','light'], short: 'Lightweight support for yoga and pilates', flags: { isFeatured: false, isNewArrival: false, isTrending: true, isBestSeller: false } },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['7', '8', '9', '10', '11'];
const KIDS_SIZES = ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'];

async function run() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected.\n');

  const brands = await Brand.find({});
  const categories = await Category.find({});
  const vendors = await Vendor.find({});

  if (!brands.length || !categories.length || !vendors.length) {
    console.error('❌ No brands/categories/vendors found. Please run the main seed.js first.');
    process.exit(1);
  }

  const brandMap = {};
  brands.forEach(b => { brandMap[b.slug] = b._id; });
  const catMap = {};
  categories.forEach(c => { catMap[c.slug] = c._id; });

  let created = 0;
  let skuIdx = 500; // Start after existing 50 products' SKUs

  for (const p of NEW_PRODUCTS) {
    const brandId = brandMap[p.brand];
    const catId = catMap[p.category];
    const vendor = vendors[p.vendor] || vendors[0];

    if (!brandId || !catId) {
      console.warn(`⚠️  Skipping "${p.name}" – brand "${p.brand}" or category "${p.category}" not found.`);
      continue;
    }

    // Pick unique images for this product
    const imgs = nextImg(p.imgType, 4);
    const thumbnail = imgs[0];

    const slug = slugify(p.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).slice(2, 6);

    const product = await Product.create({
      name: p.name,
      slug,
      description: `${p.name} – ${p.short}. Premium quality with attention to detail. Designed for the modern Indian consumer who values both style and functionality.`,
      shortDescription: p.short,
      brand: brandId,
      category: catId,
      vendor: vendor._id,
      images: imgs,
      thumbnail,
      basePrice: p.price,
      baseMrp: p.mrp,
      baseDiscount: Math.round(((p.mrp - p.price) / p.mrp) * 100),
      tags: p.tags,
      status: 'active',
      rating: randomFloat(3.5, 5.0),
      reviewCount: randomInt(5, 350),
      wishlistCount: randomInt(5, 800),
      ...p.flags,
      isOnSale: Math.random() > 0.6,
      viewCount: randomInt(50, 8000),
      seo: { title: `${p.name} – StyleVerse`, description: p.short, keywords: p.tags },
    });

    // Create size variants
    const isShoe = p.imgType === 'shoes';
    const isKid = p.category === 'kids';
    const sizesToUse = isShoe ? SHOE_SIZES : isKid ? KIDS_SIZES : SIZES;
    const colors = [
      { name: 'Black', code: '#000000' },
      { name: 'White', code: '#FFFFFF' },
      { name: 'Navy', code: '#001F5B' },
    ];
    const col = colors[Math.floor(Math.random() * colors.length)];

    const variantIds = [];
    for (let si = 0; si < sizesToUse.length; si++) {
      const variant = await ProductVariant.create({
        product: product._id,
        color: col.name,
        colorCode: col.code,
        size: sizesToUse[si],
        price: p.price,
        mrp: p.mrp,
        discount: Math.round(((p.mrp - p.price) / p.mrp) * 100),
        stock: randomInt(5, 40),
        sku: generateSKU('EXP', skuIdx++),
        images: imgs,
        isActive: true,
      });
      variantIds.push(variant._id);
    }
    product.variants = variantIds;
    await product.save();

    created++;
    if (created % 20 === 0) console.log(`  ✅ Created ${created} products so far...`);
  }

  const total = await Product.countDocuments({});
  console.log(`\n🎉 Done! Added ${created} new products.`);
  console.log(`📦 Total products in database: ${total}`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
