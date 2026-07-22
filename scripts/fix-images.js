/**
 * STYLEVERSE – SMART MATCHING IMAGE FIXER v5 (Unique Images)
 * Uses loremflickr.com with category-specific tags and unique lock seeds per product.
 * Run: node scripts/fix-images.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styleverse';

const productSchema = new mongoose.Schema(
  { name: String, slug: String, thumbnail: String, images: [String] },
  { timestamps: true, strict: false }
);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// ── KEYWORD DETECTOR ────────────────────────────────────────────────────────
function getImgKeywords(name) {
  const n = name.toLowerCase();

  if (n.includes('air max') || n.includes('ultraboost') || n.includes('stan smith') ||
      n.includes('superstar') || n.includes('nmd') || n.includes('forum') ||
      n.includes('jordan') || n.includes('pegasus') || n.includes('metcon') ||
      n.includes('react infinity') || n.includes('tanjun') || n.includes('flex experience') ||
      n.includes('rs-x') || n.includes('cali sport') || n.includes('suede classic') ||
      n.includes('future rider') || n.includes('mayze') || n.includes('smash') ||
      n.includes('court vision') || n.includes('cloudfoam') || n.includes('vikky') ||
      n.includes('electron') || n.includes('fortarun') || n.includes('trekking boot') ||
      n.includes('sneaker') || n.includes('shoe') || n.includes('boot') || n.includes('footwear')) {
    return 'shoes,sneakers';
  }

  if (n.includes('watch') || n.includes('chronograph') || n.includes('fossil') ||
      n.includes('titan') || n.includes('smartwatch') || n.includes('timepiece')) {
    return 'watch,timepiece';
  }

  if (n.includes('backpack') || n.includes('bag') || n.includes('clutch') ||
      n.includes('tote') || n.includes('duffel') || n.includes('sling') ||
      n.includes('trolley') || n.includes('daypack') || n.includes('crossbody')) {
    return 'backpack,handbag';
  }

  if (n.includes('saree') || n.includes('sari')) {
    return 'saree,sari';
  }
  if (n.includes('kurti') || n.includes('kurta') || n.includes('lehenga') || n.includes('anarkali') || n.includes('palazzo') || n.includes('salwar')) {
    return 'kurti,indianwear';
  }

  if (n.includes('hoodie') || n.includes('sweatshirt') || n.includes('pullover')) {
    return 'hoodie,sweatshirt';
  }

  if (n.includes('jacket') || n.includes('coat') || n.includes('parka') || n.includes('blazer') || n.includes('windbreaker') || n.includes('vest')) {
    return 'jacket,coat';
  }

  if (n.includes('kids') || n.includes('junior') || n.includes('zoop')) {
    return 'child,clothing';
  }

  if (n.includes('sports bra') || n.includes('bra') || n.includes('tights') || n.includes('leggings') || n.includes('track pant') || n.includes('jogger') || n.includes('singlet') || n.includes('jersey') || n.includes('dri-fit') || n.includes('aeroready')) {
    return 'sportswear,activewear';
  }

  if (n.includes('dress') || n.includes('skirt') || n.includes('blouse') || n.includes('top') || n.includes('co-ord') || n.includes('coord')) {
    return 'dress,clothing';
  }

  if (n.includes('jeans') || n.includes('denim') || n.includes('chino') || n.includes('trouser')) {
    return 'jeans,denim';
  }

  return 'tshirt,clothing';
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected.\n');

  const products = await Product.find({}).sort({ _id: 1 });
  console.log(`📦 Found ${products.length} products to update.\n`);

  let globalSig = 100; // Start at 100 to avoid cache collisions
  let updated = 0;

  for (const prod of products) {
    const keywords = getImgKeywords(prod.name);

    // Each product gets 4 unique images (shifting the seed by 1)
    const img1 = `https://loremflickr.com/800/1000/${keywords}?lock=${globalSig}`;
    const img2 = `https://loremflickr.com/800/1000/${keywords}?lock=${globalSig + 1}`;
    const img3 = `https://loremflickr.com/800/1000/${keywords}?lock=${globalSig + 2}`;
    const img4 = `https://loremflickr.com/800/1000/${keywords}?lock=${globalSig + 3}`;

    await Product.updateOne(
      { _id: prod._id },
      { $set: { thumbnail: img1, images: [img1, img2, img3, img4] } }
    );

    globalSig += 4; // Increment by 4 so the next product has completely fresh seeds
    updated++;

    if (updated % 30 === 0) {
      console.log(`  ✅ ${updated}/${products.length} updated...`);
    }
  }

  console.log(`\n🎉 Done! ${updated} products updated with unique seeded images.`);
  console.log(`\nSample URLs generated:`);

  const samples = await Product.find({}).sort({ _id: 1 }).limit(5).select('name thumbnail');
  for (const s of samples) {
    console.log(`  "${s.name}"\n    → ${s.thumbnail}\n`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
