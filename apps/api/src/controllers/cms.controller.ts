import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import slugify from 'slugify';
import { Category } from '../models/Category.model';
import { Brand } from '../models/Brand.model';
import { Banner } from '../models/Banner.model';
import { CMSPage } from '../models/CMSPage.model';
import { Blog } from '../models/Blog.model';
import { Newsletter } from '../models/Newsletter.model';
import { Settings } from '../models/Settings.model';
import { Address } from '../models/Address.model';
import { Coupon } from '../models/Coupon.model';
import { User } from '../models/User.model';
import cloudinary from '../config/cloudinary';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// ======= CATEGORIES =======

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true, parent: null })
    .populate({ path: 'children', match: { isActive: true } })
    .sort({ name: 1 });
  res.status(200).json({ success: true, data: categories });
});

export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ level: 1, name: 1 }).populate('parent', 'name slug');
  res.status(200).json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, image, icon, parent, seo } = req.body;
  const slug = slugify(name, { lower: true, strict: true });

  let level = 0;
  if (parent) {
    const parentCat = await Category.findById(parent);
    if (!parentCat) throw new AppError('Parent category not found.', 404);
    level = parentCat.level + 1;
  }

  const category = await Category.create({ name, slug, description, image, icon, parent: parent || null, level, seo });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;
  if (updates.name) updates.slug = slugify(updates.name, { lower: true, strict: true });

  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!category) throw new AppError('Category not found.', 404);
  res.status(200).json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found.', 404);

  const hasChildren = await Category.findOne({ parent: req.params.id });
  if (hasChildren) throw new AppError('Cannot delete category with subcategories.', 400);

  await Category.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Category deleted.' });
});

// ======= BRANDS =======

export const getBrands = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, data: brands });
});

export const getFeaturedBrands = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await Brand.find({ isActive: true, isFeatured: true }).sort({ name: 1 }).limit(20);
  res.status(200).json({ success: true, data: brands });
});

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, logo, banner, website, isFeatured, seo } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  const brand = await Brand.create({ name, slug, description, logo, banner, website, isFeatured, seo });
  res.status(201).json({ success: true, data: brand });
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;
  if (updates.name) updates.slug = slugify(updates.name, { lower: true, strict: true });
  const brand = await Brand.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!brand) throw new AppError('Brand not found.', 404);
  res.status(200).json({ success: true, data: brand });
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  await Brand.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Brand deleted.' });
});

// ======= BANNERS =======

export const getBanners = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    $or: [{ startDate: { $lte: now } }, { startDate: null }],
    $or: [{ endDate: { $gte: now } }, { endDate: null }],
  }).sort({ position: 1 });
  res.status(200).json({ success: true, data: banners });
});

export const getAllBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find().sort({ position: 1 });
  res.status(200).json({ success: true, data: banners });
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, data: banner });
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) throw new AppError('Banner not found.', 404);
  res.status(200).json({ success: true, data: banner });
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Banner deleted.' });
});

// ======= CMS PAGES =======

export const getCMSPages = asyncHandler(async (_req: Request, res: Response) => {
  const pages = await CMSPage.find({ isActive: true }).select('-content');
  res.status(200).json({ success: true, data: pages });
});

export const getCMSPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await CMSPage.findOne({ slug: req.params.slug, isActive: true });
  if (!page) throw new AppError('Page not found.', 404);
  res.status(200).json({ success: true, data: page });
});

export const createCMSPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await CMSPage.create(req.body);
  res.status(201).json({ success: true, data: page });
});

export const updateCMSPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await CMSPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!page) throw new AppError('Page not found.', 404);
  res.status(200).json({ success: true, data: page });
});

export const deleteCMSPage = asyncHandler(async (req: Request, res: Response) => {
  await CMSPage.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Page deleted.' });
});

// ======= BLOGS =======

export const getBlogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 9, tag, category } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const filter: Record<string, unknown> = { status: 'published' };
  if (tag) filter.tags = tag;
  if (category) filter.categories = category;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .sort({ publishedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('author', 'name avatar')
      .select('-content'),
    Blog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: blogs,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

export const getBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, status: 'published' },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate('author', 'name avatar');
  if (!blog) throw new AppError('Blog not found.', 404);
  res.status(200).json({ success: true, data: blog });
});

export const createBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, excerpt, content, coverImage, categories, tags, status, seo } = req.body;
  const slug = slugify(title, { lower: true, strict: true });
  const blog = await Blog.create({
    title, slug, excerpt, content, coverImage, categories, tags, status, seo,
    author: req.user!.id,
  });
  res.status(201).json({ success: true, data: blog });
});

export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!blog) throw new AppError('Blog not found.', 404);
  res.status(200).json({ success: true, data: blog });
});

export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Blog deleted.' });
});

// ======= NEWSLETTER =======

export const subscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const existing = await Newsletter.findOne({ email });

  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      existing.subscribedAt = new Date();
      await existing.save();
      res.status(200).json({ success: true, message: 'Re-subscribed successfully!' });
    } else {
      res.status(200).json({ success: true, message: 'Already subscribed.' });
    }
    return;
  }

  await Newsletter.create({ email });
  res.status(201).json({ success: true, message: 'Subscribed to newsletter!' });
});

export const unsubscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
  await Newsletter.findOneAndUpdate(
    { email: req.params.email },
    { isActive: false, unsubscribedAt: new Date() }
  );
  res.status(200).json({ success: true, message: 'Unsubscribed.' });
});

// ======= SETTINGS =======

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.status(200).json({ success: true, data: settings });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(req.body);
  } else {
    settings = await Settings.findOneAndUpdate({}, req.body, { new: true });
  }
  res.status(200).json({ success: true, message: 'Settings updated.', data: settings });
});

// ======= UPLOAD =======

export const uploadImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('No file provided.', 400);

  const folder = req.body.folder || 'general';

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `styleverse/${folder}`, transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as any);
      }
    );
    uploadStream.end(req.file!.buffer);
  });

  res.status(200).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id },
  });
});

export const uploadMultipleImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.files || !(req.files as Express.Multer.File[]).length) {
    throw new AppError('No files provided.', 400);
  }

  const folder = req.body.folder || 'general';
  const files = req.files as Express.Multer.File[];

  const uploads = await Promise.all(
    files.map((file) =>
      new Promise<{ url: string; publicId: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `styleverse/${folder}`, transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: (result as any).secure_url, publicId: (result as any).public_id });
          }
        );
        stream.end(file.buffer);
      })
    )
  );

  res.status(200).json({ success: true, data: uploads });
});

// ======= ADDRESSES =======

export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const addresses = await Address.find({ user: req.user!.id }).sort({ isDefault: -1 });
  res.status(200).json({ success: true, data: addresses });
});

export const createAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const address = await Address.create({ ...req.body, user: req.user!.id });
  res.status(201).json({ success: true, data: address });
});

export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    req.body,
    { new: true }
  );
  if (!address) throw new AppError('Address not found.', 404);
  res.status(200).json({ success: true, data: address });
});

export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Address.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  res.status(200).json({ success: true, message: 'Address deleted.' });
});

// ======= COUPONS =======

export const getCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: coupons });
});

export const createCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user!.id });
  res.status(201).json({ success: true, data: coupon });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new AppError('Coupon not found.', 404);
  res.status(200).json({ success: true, data: coupon });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Coupon deleted.' });
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, orderAmount } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon || coupon.expiresAt < new Date()) {
    throw new AppError('Invalid or expired coupon.', 400);
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached.', 400);
  }
  if (orderAmount < coupon.minOrderAmount) {
    throw new AppError(`Minimum order amount ₹${coupon.minOrderAmount} required.`, 400);
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (orderAmount * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  res.status(200).json({
    success: true,
    data: {
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description },
      discount: Math.round(discount),
    },
  });
});

// ======= USERS (Admin) =======

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: String(search), $options: 'i' } },
    { email: { $regex: String(search), $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: users,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
});

// Homepage data aggregation
export const getHomepageData = asyncHandler(async (_req: Request, res: Response) => {
  const [banners, featuredCategories, featuredBrands, settings] = await Promise.all([
    Banner.find({ isActive: true }).sort({ position: 1 }),
    Category.find({ isActive: true, parent: null }).limit(10).sort({ productCount: -1 }),
    Brand.find({ isActive: true, isFeatured: true }).limit(20),
    Settings.findOne(),
  ]);

  res.status(200).json({
    success: true,
    data: { banners, featuredCategories, featuredBrands, settings },
  });
});
