import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Order } from '../models/Order.model';
import { User } from '../models/User.model';
import { Vendor } from '../models/Vendor.model';
import { Product } from '../models/Product.model';
import { Category } from '../models/Category.model';
import { ActivityLog } from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { getOrCreateAdminVendor } from './vendor.controller';
import { stringify } from 'csv-stringify/sync';

// @route   GET /api/v1/reports/admin/overview
export const getAdminAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalOrders,
    monthOrders,
    totalUsers,
    newUsers,
    totalVendors,
    pendingVendors,
    totalProducts,
    pendingProducts,
    ordersByStatus,
    revenueByMonth,
    topProducts,
    topVendors,
    topCategories,
  ] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: startOfMonth } }),
    Vendor.countDocuments(),
    Vendor.countDocuments({ status: 'pending' }),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ status: 'pending' }),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { 'product.name': 1, 'product.slug': 1, 'product.thumbnail': 1, totalSold: 1, revenue: 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.vendor', revenue: { $sum: '$items.total' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
      { $unwind: '$vendor' },
      { $project: { 'vendor.storeName': 1, 'vendor.storeSlug': 1, revenue: 1, orders: 1 } },
    ]),
    Category.find({ isActive: true }).sort({ productCount: -1 }).limit(8).select('name slug productCount image'),
  ]);

  const monthlyRevenue = revenueByMonth.map((item: any) => ({
    month: new Date(item._id.year, item._id.month - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
    revenue: item.revenue,
    orders: item.orders,
  }));

  const statusMap: Record<string, number> = {};
  ordersByStatus.forEach((s: any) => { statusMap[s._id] = s.count; });

  const revenueGrowth = lastMonthRevenue[0]?.total > 0
    ? (((monthRevenue[0]?.total || 0) - lastMonthRevenue[0].total) / lastMonthRevenue[0].total) * 100
    : 0;

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        totalOrders,
        monthOrders,
        totalUsers,
        newUsers,
        totalVendors,
        pendingVendors,
        totalProducts,
        pendingProducts,
      },
      ordersByStatus: statusMap,
      revenueByMonth: monthlyRevenue,
      topProducts,
      topVendors,
      topCategories,
    },
  });
});

// @route   GET /api/v1/reports/vendor/analytics
export const getVendorAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  let vendor;
  if (['admin', 'support'].includes(req.user!.role)) {
    vendor = await getOrCreateAdminVendor(req.user!.id);
  } else {
    vendor = await Vendor.findOne({ user: req.user!.id });
  }
  if (!vendor) {
    res.status(404).json({ success: false, message: 'Vendor not found.' });
    return;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const isAdminOrSupport = ['admin', 'support'].includes(req.user!.role);
  const vendorMatch = isAdminOrSupport ? {} : { 'items.vendor': vendor._id };

  const [
    totalRevenue,
    monthRevenue,
    totalOrders,
    monthOrders,
    revenueByMonth,
    topProducts,
    ordersByStatus,
  ] = await Promise.all([
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { ...vendorMatch, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$items.total' } } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { ...vendorMatch, paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$items.total' } } },
    ]),
    Order.countDocuments(isAdminOrSupport ? {} : { 'items.vendor': vendor._id }),
    Order.countDocuments(isAdminOrSupport ? { createdAt: { $gte: startOfMonth } } : { 'items.vendor': vendor._id, createdAt: { $gte: startOfMonth } }),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { ...vendorMatch, paymentStatus: 'paid', createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } } },
      { $group: { _id: { month: { $month: '$createdAt' } }, revenue: { $sum: '$items.total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: vendorMatch },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { 'product.name': 1, 'product.thumbnail': 1, totalSold: 1, revenue: 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: vendorMatch },
      { $group: { _id: '$items.status', count: { $sum: 1 } } },
    ]),
  ]);

  const statusMap: Record<string, number> = {};
  ordersByStatus.forEach((s: any) => { statusMap[s._id] = s.count; });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = revenueByMonth.map((item: any) => ({
    month: monthNames[item._id.month - 1],
    revenue: item.revenue,
    orders: item.orders,
  }));

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        totalOrders,
        monthOrders,
        rating: vendor.rating,
      },
      revenueByMonth: monthlyRevenue,
      topProducts,
      ordersByStatus: statusMap,
    },
  });
});

// @route   GET /api/v1/reports/export/orders (Admin – CSV)
export const exportOrdersCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, status } = req.query;
  const filter: Record<string, unknown> = {};

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as any).$gte = new Date(String(startDate));
    if (endDate) (filter.createdAt as any).$lte = new Date(String(endDate));
  }
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10000)
    .lean();

  const rows = orders.map((o) => ({
    'Order Number': o.orderNumber,
    'Invoice': o.invoiceNumber,
    'Customer': (o.user as any)?.name || '',
    'Email': (o.user as any)?.email || '',
    'Date': new Date(o.createdAt).toLocaleDateString('en-IN'),
    'Status': o.status,
    'Payment Status': o.paymentStatus,
    'Payment Method': o.paymentMethod,
    'Subtotal': o.subtotal,
    'Discount': o.discount,
    'Coupon Discount': o.couponDiscount,
    'Shipping': o.shippingFee,
    'Tax': o.tax,
    'Total': o.total,
    'City': o.shippingAddress.city,
    'State': o.shippingAddress.state,
  }));

  const csv = stringify(rows, { header: true });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
  res.send(csv);
});

// @route   GET /api/v1/reports/activity-logs (Admin)
export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, entity, action } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const filter: Record<string, unknown> = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name email role')
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});
