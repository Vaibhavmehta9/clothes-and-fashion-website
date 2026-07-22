import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import slugify from 'slugify';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Brand } from '../models/Brand.model';
import { Category } from '../models/Category.model';
import { Vendor } from '../models/Vendor.model';
import { Review } from '../models/Review.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import cloudinary from '../config/cloudinary';
import mongoose from 'mongoose';
// Helper: generate unique slug
const generateUniqueSlug = async (name: string): Promise<string> => {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let count = 0;
  while (await Product.findOne({ slug })) {
    count++;
    slug = `${base}-${count}`;
  }
  return slug;
};

// @route   GET /api/v1/products
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 24,
    category,
    brand,
    vendor,
    minPrice,
    maxPrice,
    rating,
    colors,
    sizes,
    isOnSale,
    isNewArrival,
    isTrending,
    isBestSeller,
    isFeatured,
    sort = 'newest',
    search,
    status = 'active',
  } = req.query;

  const filter: Record<string, unknown> = {};

  // Status filter (admin can see all, else only active)
  if (req.user?.role === 'admin') {
    if (status !== 'all') filter.status = status;
  } else {
    filter.status = 'active';
  }

  if (category) {
    const categoryStr = String(category).trim();
    if (mongoose.Types.ObjectId.isValid(categoryStr)) {
      filter.category = categoryStr;
    } else {
      try {
        const escaped = categoryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cat = await Category.findOne({
          $or: [
            { slug: categoryStr.toLowerCase() },
            { name: { $regex: new RegExp(`^${escaped}$`, 'i') } }
          ]
        });

        const catOrConditions: Record<string, unknown>[] = [
          { tags: { $in: [categoryStr] } },
          { name: { $regex: new RegExp(`\\b${escaped}\\b`, 'i') } }
        ];

        if (cat) {
          const subCats = await Category.find({ parent: cat._id }).select('_id');
          const catIds = [cat._id, ...subCats.map(c => c._id)];
          catOrConditions.unshift({ category: { $in: catIds } });
        }

        filter.$or = catOrConditions;
      } catch (err) {
        console.error('Error matching category filter:', err);
      }
    }
  }

  if (brand) {
    const brandStr = String(brand).trim();
    if (mongoose.Types.ObjectId.isValid(brandStr)) {
      filter.brand = brandStr;
    } else {
      try {
        const escaped = brandStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const b = await Brand.findOne({
          $or: [
            { slug: brandStr.toLowerCase() },
            { name: { $regex: new RegExp(`^${escaped}$`, 'i') } }
          ]
        });

        const brandOrConditions: Record<string, unknown>[] = [
          { tags: { $in: [brandStr.toLowerCase()] } },
          { name: { $regex: new RegExp(escaped, 'i') } }
        ];

        if (b) {
          brandOrConditions.unshift({ brand: b._id });
        }

        if (filter.$or) {
          filter.$and = [
            { $or: filter.$or as any[] },
            { $or: brandOrConditions }
          ];
          delete filter.$or;
        } else {
          filter.$or = brandOrConditions;
        }
      } catch (err) {
        console.error('Error matching brand filter:', err);
      }
    }
  }
  if (vendor) filter.vendor = vendor;
  if (isOnSale === 'true') filter.isOnSale = true;
  if (isNewArrival === 'true') filter.isNewArrival = true;
  if (isTrending === 'true') filter.isTrending = true;
  if (isBestSeller === 'true') filter.isBestSeller = true;
  if (isFeatured === 'true') filter.isFeatured = true;
  if (rating) filter.rating = { $gte: Number(rating) };
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) (filter.basePrice as Record<string, number>).$gte = Number(minPrice);
    if (maxPrice) (filter.basePrice as Record<string, number>).$lte = Number(maxPrice);
  }
  if (search) {
    filter.$text = { $search: String(search) };
  }

  // Sort options
  const sortMap: Record<string, Record<string, number>> = {
    newest: { createdAt: -1 },
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
    rating: { rating: -1 },
    popular: { viewCount: -1 },
    discount: { baseDiscount: -1 },
  };
  const sortQuery = sortMap[String(sort)] || { createdAt: -1 };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .populate('vendor', 'storeName storeSlug')
      .populate({
        path: 'variants',
        match: { isActive: true },
        select: 'color colorCode size price mrp discount stock sku images',
      })
      .lean(),
    Product.countDocuments(filter),
  ]);

  // Filter by color/size via variants
  let filteredProducts = products;
  if (colors) {
    const colorList = String(colors).split(',');
    filteredProducts = filteredProducts.filter((p) =>
      (p.variants as any[]).some((v) => colorList.includes(v.color))
    );
  }
  if (sizes) {
    const sizeList = String(sizes).split(',');
    filteredProducts = filteredProducts.filter((p) =>
      (p.variants as any[]).some((v) => sizeList.includes(v.size))
    );
  }

  res.status(200).json({
    success: true,
    message: 'Products retrieved.',
    data: filteredProducts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// @route   GET /api/v1/products/:slug
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;

  const product = await Product.findOne({
    $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }],
    ...(req.user?.role !== 'admin' && { status: 'active' }),
  })
    .populate('brand', 'name slug logo')
    .populate('category', 'name slug parent')
    .populate('vendor', 'storeName storeSlug storeLogo rating reviewCount')
    .populate({
      path: 'variants',
      match: { isActive: true },
    });

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  // Increment view count
  await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });

  // Get related products
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    status: 'active',
  })
    .limit(8)
    .select('name slug thumbnail basePrice baseMrp baseDiscount rating reviewCount')
    .lean();

  res.status(200).json({
    success: true,
    data: { product, related },
  });
});

// @route   POST /api/v1/products (Vendor/Admin)
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, shortDescription, brand, category, tags, variants, isFeatured, isNewArrival, isTrending, seo } = req.body;

  // Find vendor for the user
  const vendor = await Vendor.findOne({ user: req.user!.id });
  if (!vendor && req.user!.role !== 'admin') {
    throw new AppError('Vendor profile not found.', 403);
  }

  const slug = await generateUniqueSlug(name);

  // Validate brand and category exist
  const [brandDoc, categoryDoc] = await Promise.all([
    Brand.findById(brand),
    Category.findById(category),
  ]);
  if (!brandDoc) throw new AppError('Brand not found.', 404);
  if (!categoryDoc) throw new AppError('Category not found.', 404);

  // Process images from request (URLs from Cloudinary upload step)
  const images: string[] = req.body.images || [];
  const thumbnail = req.body.thumbnail || images[0] || '';

  const product = await Product.create({
    name,
    slug,
    description,
    shortDescription,
    brand,
    category,
    vendor: vendor?._id || req.body.vendor,
    images,
    thumbnail,
    basePrice: variants[0]?.price || 0,
    baseMrp: variants[0]?.mrp || 0,
    baseDiscount: variants[0]?.discount || 0,
    tags: tags || [],
    status: req.user!.role === 'admin' ? 'active' : 'pending',
    isFeatured: isFeatured || false,
    isNewArrival: isNewArrival || false,
    isTrending: isTrending || false,
    seo: seo || {},
  });

  // Create variants
  if (variants && variants.length > 0) {
    const variantDocs = await Promise.all(
      variants.map(async (v: Record<string, unknown>, idx: number) => {
        const sku = `SV-${String(brand).slice(0, 3).toUpperCase()}-${String(product._id).slice(-4).toUpperCase()}-${String(idx + 1).padStart(2, '0')}`;
        return ProductVariant.create({ ...v, product: product._id, sku });
      })
    );
    product.variants = variantDocs.map((v) => v._id);
    await product.save();
  }

  // Update brand and category product counts
  await Promise.all([
    Brand.findByIdAndUpdate(brand, { $inc: { productCount: 1 } }),
    Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } }),
  ]);

  const populated = await Product.findById(product._id)
    .populate('brand', 'name slug')
    .populate('category', 'name slug')
    .populate('variants');

  res.status(201).json({
    success: true,
    message: req.user!.role === 'admin' ? 'Product created and active.' : 'Product submitted for approval.',
    data: populated,
  });
});

// @route   PUT /api/v1/products/:id
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found.', 404);

  // Vendor can only edit their own products
  if (req.user!.role === 'vendor') {
    const vendor = await Vendor.findOne({ user: req.user!.id });
    if (!vendor || String(product.vendor) !== String(vendor._id)) {
      throw new AppError('Not authorized to edit this product.', 403);
    }
  }

  const allowedFields = ['name', 'description', 'shortDescription', 'tags', 'images', 'thumbnail', 'isFeatured', 'isNewArrival', 'isTrending', 'isBestSeller', 'isOnSale', 'saleEndsAt', 'seo', 'status'];
  const updates: Record<string, unknown> = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.body.name && req.body.name !== product.name) {
    updates.slug = await generateUniqueSlug(req.body.name);
  }

  // Vendor can't change status directly
  if (req.user!.role === 'vendor') {
    delete updates.status;
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate('brand', 'name slug')
    .populate('category', 'name slug')
    .populate('variants');

  res.status(200).json({ success: true, message: 'Product updated.', data: updated });
});

// @route   DELETE /api/v1/products/:id
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found.', 404);

  // Vendor can only delete their own products
  if (req.user!.role === 'vendor') {
    const vendor = await Vendor.findOne({ user: req.user!.id });
    if (!vendor || String(product.vendor) !== String(vendor._id)) {
      throw new AppError('Not authorized.', 403);
    }
  }

  // Delete variants
  await ProductVariant.deleteMany({ product: product._id });

  // Delete images from Cloudinary
  for (const img of product.images) {
    const publicId = img.split('/').pop()?.split('.')[0];
    if (publicId) {
      try { await cloudinary.uploader.destroy(`styleverse/products/${publicId}`); } catch { /* ignore */ }
    }
  }

  await Product.findByIdAndDelete(req.params.id);

  // Decrement counts
  await Promise.all([
    Brand.findByIdAndUpdate(product.brand, { $inc: { productCount: -1 } }),
    Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } }),
  ]);

  res.status(200).json({ success: true, message: 'Product deleted.' });
});

// @route   GET /api/v1/products/homepage
export const getHomepageProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const baseFilter = { status: 'active' };

  const [newArrivals, trending, bestSellers, featured, onSale] = await Promise.all([
    Product.find({ ...baseFilter, isNewArrival: true }).limit(12).select('name slug thumbnail basePrice baseMrp baseDiscount rating reviewCount brand').populate('brand', 'name'),
    Product.find({ ...baseFilter, isTrending: true }).limit(12).select('name slug thumbnail basePrice baseMrp baseDiscount rating reviewCount brand').populate('brand', 'name'),
    Product.find({ ...baseFilter, isBestSeller: true }).limit(12).select('name slug thumbnail basePrice baseMrp baseDiscount rating reviewCount brand').populate('brand', 'name'),
    Product.find({ ...baseFilter, isFeatured: true }).limit(8).select('name slug thumbnail basePrice baseMrp baseDiscount rating reviewCount brand').populate('brand', 'name'),
    Product.find({ ...baseFilter, isOnSale: true }).limit(12).select('name slug thumbnail basePrice baseMrp baseDiscount rating reviewCount saleEndsAt brand').populate('brand', 'name'),
  ]);

  res.status(200).json({
    success: true,
    data: { newArrivals, trending, bestSellers, featured, onSale },
  });
});

// @route   POST /api/v1/products/:id/approve (Admin)
export const approveProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, rejectionReason } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      status,
      ...(rejectionReason && { rejectionReason }),
      ...(status === 'active' && { approvedBy: req.user!.id, approvedAt: new Date() }),
    },
    { new: true }
  );

  if (!product) throw new AppError('Product not found.', 404);

  res.status(200).json({ success: true, message: `Product ${status}.`, data: product });
});

// @route   GET /api/v1/products/search
export const searchProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, limit = 10 } = req.query;

  if (!q || String(q).trim().length < 2) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const products = await Product.find({
    $text: { $search: String(q) },
    status: 'active',
  })
    .limit(Number(limit))
    .select('name slug thumbnail basePrice rating')
    .lean();

  res.status(200).json({ success: true, data: products });
});
