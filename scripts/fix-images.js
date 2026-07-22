/**
 * STYLEVERSE – SMART MATCHING IMAGE FIXER v6 (Unsplash Images)
 * Uses high-quality Unsplash images mapped to categories.
 * Run: node scripts/fix-images.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styleverse';

const productSchema = new mongoose.Schema(
  { name: String, slug: String, thumbnail: String, images: [String], category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' } },
  { timestamps: true, strict: false }
);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const UNIQUE_IMAGES = {
  shoes: [
    'photo-1542291026-7eec264c27ff', 'photo-1606107557195-0e29a4b5b4aa', 'photo-1608231387042-66d1773070a5',
    'photo-1539185441755-769473a23570', 'photo-1460353581641-37baddab0fa2', 'photo-1595950653106-6c9ebd614d3a',
    'photo-1525966222134-fcfa99b8ae77', 'photo-1560769629-975ec94e6a86', 'photo-1514989940723-e8e51635b782'
  ],
  dress: [
    'photo-1496747611176-843222e1e57c', 'photo-1515886657613-9f3515b0c78f', 'photo-1572804013309-59a88b7e92f1',
    'photo-1595777457583-95e059d581b8', 'photo-1539008835657-9e8e9680c956', 'photo-1612336307429-8a898d10e223',
    'photo-1585487000160-6ebcfceb0d03', 'photo-1566150905458-1bf1fc113f0d', 'photo-1571513722275-4b41940f54b8'
  ],
  jacket: [
    'photo-1551028719-00167b16eac5', 'photo-1591047139829-d91aecb6caea', 'photo-1551488831-00ddcb6c6bd3',
    'photo-1544923246-77307dd654cb', 'photo-1604644401890-0bd678c83788', 'photo-1521223832859-c8fc9ce20a52',
    'photo-1509539662397-116cb90542f1', 'photo-1593030761757-71fae45fa0e7'
  ],
  saree: [
    'photo-1583391733981-8498408ee4b2', 'photo-1617627143233-4df547d06a15', 'photo-1610030469983-98e550d6193c',
    'photo-1609357605129-26f69add5d6e', 'photo-1552664730-d307ca884978', 'photo-1583391265517-35bbdf460b6e'
  ],
  watch: [
    'photo-1524592094714-0f0654e20314', 'photo-1523170335258-f5ed11844a49', 'photo-1612817288484-6f916006741a',
    'photo-1587836173595-c15c2a07c3be', 'photo-1508656910606-c87d605bd2fb', 'photo-1522312346375-d1a52e2b99b3'
  ],
  bag: [
    'photo-1548036328-c9fa89d128fa', 'photo-1553062407-98eeb64c6a62', 'photo-1590874103328-eac38a683ce7',
    'photo-1584916201218-f4242ceb4809', 'photo-1598532163257-ae3c6b2524b6', 'photo-1591561954557-26941169b49e'
  ],
  hoodie: [
    'photo-1556821840-3a63f15732ce', 'photo-1543163521-1bf539c55dd2', 'photo-1517292987719-0369a794ec0f',
    'photo-1620799139834-6b8f844fbe61', 'photo-1578768079052-aa76e52ff62e', 'photo-1559311648-d46f5d8593d6'
  ],
  kurti: [
    'photo-1608748010899-18f300247112', 'photo-1609357605129-26f69add5d6e', 'photo-1583391733981-8498408ee4b2',
    'photo-1617627143233-4df547d06a15', 'photo-1631857455684-a54a2f03665f', 'photo-1552664684-25e4f4fb8ee8'
  ],
  jeans: [
    'photo-1541099649105-f69ad21f3246', 'photo-1584370848010-d7fe6bc767eb', 'photo-1604176354204-9268737828e4',
    'photo-1542272604-787c3835535d', 'photo-1602293589930-45aad59ba3ab', 'photo-1576995853123-5a10305d93c0'
  ],
  tshirt: [
    'photo-1521572163474-6864f9cf17ab', 'photo-1576566588028-4147f3842f27', 'photo-1503341455253-b2e723bb3dbb',
    'photo-1529374255404-311a2a4f1fd9', 'photo-1583743814966-8936f5b7be1a', 'photo-1562157873-818bc0726f68',
    'photo-1581655353564-df123a1eb820', 'photo-1574180566232-aaad1b5b8450', 'photo-1527719327859-c6ce80353573'
  ]
};

function getImageType(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('shoes') || lowerName.includes('sneaker') || lowerName.includes('boot')) return 'shoes';
  if (lowerName.includes('bag') || lowerName.includes('backpack')) return 'bag';
  if (lowerName.includes('watch') || lowerName.includes('timepiece')) return 'watch';
  if (lowerName.includes('saree') || lowerName.includes('sari')) return 'saree';
  if (lowerName.includes('kurti') || lowerName.includes('palazzo') || lowerName.includes('lehenga')) return 'kurti';
  if (lowerName.includes('dress') || lowerName.includes('skirt') || lowerName.includes('slip')) return 'dress';
  if (lowerName.includes('jacket') || lowerName.includes('coat') || lowerName.includes('blazer')) return 'jacket';
  if (lowerName.includes('hoodie') || lowerName.includes('sweatshirt') || lowerName.includes('sweater')) return 'hoodie';
  if (lowerName.includes('jeans') || lowerName.includes('pants') || lowerName.includes('chinos')) return 'jeans';
  
  return 'tshirt';
}

async function run() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected.\n');

  const products = await Product.find({}).sort({ _id: 1 });
  console.log(`📦 Found ${products.length} products to update.\n`);

  let updated = 0;
  
  // Keep track of index per category for rotation
  const counters = {};

  for (const prod of products) {
    const type = getImageType(prod.name);
    
    if (counters[type] === undefined) {
      counters[type] = 0;
    }
    
    const photos = UNIQUE_IMAGES[type] || UNIQUE_IMAGES['tshirt'];
    
    // Select 4 images for the product
    const img1 = `https://images.unsplash.com/${photos[(counters[type] + 0) % photos.length]}?auto=format&fit=crop&w=800&q=80`;
    const img2 = `https://images.unsplash.com/${photos[(counters[type] + 1) % photos.length]}?auto=format&fit=crop&w=800&q=80`;
    const img3 = `https://images.unsplash.com/${photos[(counters[type] + 2) % photos.length]}?auto=format&fit=crop&w=800&q=80`;
    const img4 = `https://images.unsplash.com/${photos[(counters[type] + 3) % photos.length]}?auto=format&fit=crop&w=800&q=80`;

    await Product.updateOne(
      { _id: prod._id },
      { $set: { thumbnail: img1, images: [img1, img2, img3, img4] } }
    );

    counters[type]++;
    updated++;

    if (updated % 30 === 0) {
      console.log(`  ✅ ${updated}/${products.length} updated...`);
    }
  }

  // Check the homepage banners too
  const Page = mongoose.models.Page || mongoose.model('Page', new mongoose.Schema({}, { strict: false }));
  const homePage = await Page.findOne({ slug: 'home' });
  if (homePage && homePage.content && homePage.content.banners) {
    homePage.content.banners = [
      {
        title: 'AJIO LUXE: THE DESIGNER EDIT',
        subtitle: 'Premium coordinates, heritage handlooms and luxury layers.',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
        mobileImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        link: '/products?isNewArrival=true',
        buttonText: 'Explore Collection',
        position: 0,
        isActive: true
      },
      {
        title: 'UP TO 60% OFF: SNEAKER FESTIVAL',
        subtitle: 'High-performance kicks and lifestyle drops. Grab Nike, Adidas & Puma.',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=80',
        mobileImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
        link: '/products?category=footwear&isOnSale=true',
        buttonText: 'Claim Offer',
        position: 1,
        isActive: true
      },
      {
        title: 'ETHNIC ELEGANCE: FESTIVE SPECIAL',
        subtitle: 'Exquisite silk coordinates, lehengas and hand-woven heritage outfits.',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
        mobileImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        link: '/products?category=ethnic-wear',
        buttonText: 'Discover Couture',
        position: 2,
        isActive: true
      }
    ];
    await Page.updateOne({ _id: homePage._id }, { $set: { content: homePage.content } });
    console.log(`\n🎉 Home page banners updated.`);
  }

  console.log(`\n🎉 Done! ${updated} products updated with Unsplash images.`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
