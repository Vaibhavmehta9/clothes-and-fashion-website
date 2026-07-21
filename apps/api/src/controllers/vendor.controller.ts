import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import slugify from 'slugify';
import { Vendor } from '../models/Vendor.model';
import { User } from '../models/User.model';
import { Notification } from '../models/Notification.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEmail, vendorApprovalEmail } from '../config/email';

// @route   POST /api/v1/vendors/register
export const registerVendor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await Vendor.findOne({ user: req.user!.id });
  if (existing) {
    throw new AppError('Vendor profile already exists.', 400);
  }

  const storeName = req.body.storeName;
  let storeSlug = slugify(storeName, { lower: true, strict: true });

  // Ensure unique slug
  let count = 0;
  while (await Vendor.findOne({ storeSlug })) {
    count++;
    storeSlug = `${slugify(storeName, { lower: true, strict: true })}-${count}`;
  }

  const vendor = await Vendor.create({
    user: req.user!.id,
    ...req.body,
    storeSlug,
    status: 'pending',
  });

  // Update user role to vendor
  await User.findByIdAndUpdate(req.user!.id, { role: 'vendor' });

  await Notification.create({
    user: req.user!.id,
    title: 'Vendor Application Received',
    body: `Your application for "${storeName}" is under review. We'll notify you within 24-48 hours.`,
    type: 'vendor',
  });

  res.status(201).json({
    success: true,
    message: 'Vendor application submitted. Awaiting approval.',
    data: vendor,
  });
});

export const getOrCreateAdminVendor = async (userId: string) => {
  let vendor = await Vendor.findOne({ user: userId });
  if (!vendor) {
    const storeName = 'Admin Store';
    let storeSlug = 'admin-store';
    vendor = await Vendor.create({
      user: userId,
      storeName,
      storeSlug,
      status: 'approved',
      storeDescription: 'Super Administrator Storefront',
      businessEmail: 'admin@styleverse.com',
      businessPhone: '9999999999',
      bankDetails: {
        accountName: 'Admin Store',
        accountNumber: '1234567890',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
      },
      address: {
        addressLine1: 'Admin HQ',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      },
    });
  }
  return vendor;
};

// @route   GET /api/v1/vendors/profile
export const getVendorProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  let vendor;
  if (['admin', 'support'].includes(req.user!.role)) {
    vendor = await getOrCreateAdminVendor(req.user!.id);
  } else {
    vendor = await Vendor.findOne({ user: req.user!.id });
  }
  if (!vendor) throw new AppError('Vendor profile not found.', 404);

  const populated = await Vendor.findById(vendor._id).populate('user', 'name email phone');
  res.status(200).json({ success: true, data: populated });
});

// @route   PUT /api/v1/vendors/profile
export const updateVendorProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const allowedFields = ['storeName', 'storeDescription', 'storeLogo', 'storeBanner', 'businessPhone', 'socialLinks'];
  const updates: Record<string, unknown> = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  let vendor;
  if (['admin', 'support'].includes(req.user!.role)) {
    const adminVendor = await getOrCreateAdminVendor(req.user!.id);
    vendor = await Vendor.findByIdAndUpdate(adminVendor._id, updates, { new: true, runValidators: true });
  } else {
    vendor = await Vendor.findOneAndUpdate(
      { user: req.user!.id },
      updates,
      { new: true, runValidators: true }
    );
  }
  if (!vendor) throw new AppError('Vendor not found.', 404);

  res.status(200).json({ success: true, message: 'Store profile updated.', data: vendor });
});

// @route   GET /api/v1/vendors (Admin)
export const getAllVendors = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) filter.storeName = { $regex: String(search), $options: 'i' };

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name email phone'),
    Vendor.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: vendors,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// @route   PUT /api/v1/vendors/:id/approve (Admin)
export const approveVendor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, rejectionReason, commissionRate } = req.body;

  const vendor = await Vendor.findByIdAndUpdate(
    req.params.id,
    {
      status,
      ...(rejectionReason && { rejectionReason }),
      ...(commissionRate && { commissionRate }),
      ...(status === 'approved' && { approvedBy: req.user!.id, approvedAt: new Date(), isVerified: true }),
    },
    { new: true }
  ).populate('user', 'name email');

  if (!vendor) throw new AppError('Vendor not found.', 404);

  // Send email + notification
  const user = vendor.user as any;
  await Notification.create({
    user: user._id,
    title: status === 'approved' ? 'Vendor Application Approved! 🎉' : 'Vendor Application Update',
    body: status === 'approved'
      ? `Congratulations! Your store "${vendor.storeName}" has been approved. Start adding products!`
      : `Your vendor application has been ${status}.`,
    type: 'vendor',
    link: status === 'approved' ? '/vendor/dashboard' : undefined,
  });

  try {
    await sendEmail({
      to: user.email,
      subject: `StyleVerse Vendor ${status === 'approved' ? 'Approved' : 'Update'}`,
      html: vendorApprovalEmail(user.name, vendor.storeName, status === 'approved'),
    });
  } catch { /* non-critical */ }

  res.status(200).json({ success: true, message: `Vendor ${status}.`, data: vendor });
});

// @route   GET /api/v1/vendors/:slug (Public)
export const getVendorBySlug = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await Vendor.findOne({ storeSlug: req.params.slug, status: 'approved' })
    .populate('user', 'name');
  if (!vendor) throw new AppError('Store not found.', 404);

  res.status(200).json({ success: true, data: vendor });
});
