import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Order } from '../models/Order.model';
import { Cart } from '../models/Cart.model';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Coupon } from '../models/Coupon.model';
import { Address } from '../models/Address.model';
import { User } from '../models/User.model';
import { Notification } from '../models/Notification.model';
import { Vendor } from '../models/Vendor.model';
import { Settings } from '../models/Settings.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEmail, orderConfirmationEmail } from '../config/email';
import PDFDocument from 'pdfkit';

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SV-${timestamp}-${random}`;
};

// @route   POST /api/v1/orders
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shippingAddressId, paymentMethod, couponCode, notes } = req.body;

  // Get cart
  const cart = await Cart.findOne({ user: req.user!.id }).populate({
    path: 'items.product',
    select: 'name thumbnail vendor status',
  }).populate('items.variant');

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty.', 400);
  }

  // Validate address
  const address = await Address.findOne({ _id: shippingAddressId, user: req.user!.id });
  if (!address) throw new AppError('Shipping address not found.', 404);

  // Validate stock
  for (const item of cart.items) {
    const variant = await ProductVariant.findById(item.variant);
    if (!variant || variant.stock < item.quantity) {
      throw new AppError(`Insufficient stock for item in cart.`, 400);
    }
  }

  // Get settings for tax
  const settings = await Settings.findOne().lean();
  const taxRate = settings?.tax || 18;
  const freeShippingThreshold = settings?.freeShippingThreshold || 999;

  // Apply coupon
  let couponDiscount = 0;
  let couponDoc = null;
  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (couponDoc && couponDoc.expiresAt > new Date() && couponDoc.usedCount < couponDoc.usageLimit) {
      const subtotal = cart.subtotal - cart.discount;
      if (subtotal >= couponDoc.minOrderAmount) {
        if (couponDoc.type === 'percentage') {
          couponDiscount = (subtotal * couponDoc.value) / 100;
          if (couponDoc.maxDiscount) couponDiscount = Math.min(couponDiscount, couponDoc.maxDiscount);
        } else if (couponDoc.type === 'fixed') {
          couponDiscount = couponDoc.value;
        } else if (couponDoc.type === 'free_shipping') {
          couponDiscount = cart.shippingFee;
        }
      }
    }
  }

  const subtotalAfterDiscount = cart.subtotal - cart.discount - couponDiscount;
  const shippingFee = subtotalAfterDiscount >= freeShippingThreshold ? 0 : (settings?.shippingFee || 99);
  const tax = Math.round((subtotalAfterDiscount * taxRate) / 100);
  const total = subtotalAfterDiscount + shippingFee + tax;

  // Build order items
  const orderItems = cart.items.map((item) => {
    const product = item.product as any;
    const variant = item.variant as any;
    return {
      product: product._id,
      variant: variant._id,
      vendor: product.vendor,
      name: product.name,
      thumbnail: product.thumbnail,
      color: variant.color,
      size: variant.size,
      quantity: item.quantity,
      price: item.price,
      mrp: item.mrp,
      discount: Math.round(((item.mrp - item.price) / item.mrp) * 100),
      total: item.price * item.quantity,
      status: 'pending',
    };
  });

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user!.id,
    items: orderItems,
    shippingAddress: {
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    },
    subtotal: cart.subtotal,
    discount: cart.discount,
    couponDiscount,
    shippingFee,
    tax,
    total,
    coupon: couponDoc?._id,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    status: 'pending',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes,
  });

  // Deduct stock
  for (const item of cart.items) {
    await ProductVariant.findByIdAndUpdate(item.variant, {
      $inc: { stock: -item.quantity },
    });
  }

  // Update coupon usage
  if (couponDoc) {
    await Coupon.findByIdAndUpdate(couponDoc._id, {
      $inc: { usedCount: 1 },
      $push: { usedBy: req.user!.id },
    });
  }

  // Update vendor stats
  const vendorRevenues: Record<string, number> = {};
  orderItems.forEach((item) => {
    const vendorId = String(item.vendor);
    vendorRevenues[vendorId] = (vendorRevenues[vendorId] || 0) + item.total;
  });
  for (const [vendorId, revenue] of Object.entries(vendorRevenues)) {
    await Vendor.findByIdAndUpdate(vendorId, {
      $inc: { totalSales: 1, totalRevenue: revenue },
    });
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user!.id }, { items: [], coupon: undefined, subtotal: 0, discount: 0, couponDiscount: 0, total: 0 });

  // Send order confirmation email + notification
  const user = await User.findById(req.user!.id);
  if (user) {
    await Notification.create({
      user: req.user!.id,
      title: 'Order Placed Successfully! 🎉',
      body: `Your order #${order.orderNumber} for ₹${total.toLocaleString('en-IN')} has been placed.`,
      type: 'order',
      link: `/orders/${order.orderNumber}`,
    });
    try {
      await sendEmail({
        to: user.email,
        subject: `Order Confirmed – ${order.orderNumber}`,
        html: orderConfirmationEmail(order.orderNumber, user.name, total),
      });
    } catch { /* Email is non-critical */ }
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully.',
    data: order,
  });
});

// @route   GET /api/v1/orders (User's orders)
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, status } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const filter: Record<string, unknown> = { user: req.user!.id };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// @route   GET /api/v1/orders/:id
export const getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('items.product', 'name slug thumbnail')
    .populate('items.variant', 'color size')
    .populate('items.vendor', 'storeName storeSlug');

  if (!order) throw new AppError('Order not found.', 404);

  // Users can only see their own orders
  if (req.user!.role === 'customer' && String(order.user) !== req.user!.id) {
    throw new AppError('Not authorized.', 403);
  }

  res.status(200).json({ success: true, data: order });
});

// @route   PUT /api/v1/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);
  if (String(order.user) !== req.user!.id && req.user!.role === 'customer') {
    throw new AppError('Not authorized.', 403);
  }

  const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  if (nonCancellableStatuses.includes(order.status)) {
    throw new AppError(`Cannot cancel an order with status: ${order.status}`, 400);
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = req.body.reason || 'Cancelled by customer';
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await ProductVariant.findByIdAndUpdate(item.variant, { $inc: { stock: item.quantity } });
  }

  await Notification.create({
    user: order.user,
    title: 'Order Cancelled',
    body: `Your order #${order.orderNumber} has been cancelled.`,
    type: 'order',
    link: `/orders/${order.orderNumber}`,
  });

  res.status(200).json({ success: true, message: 'Order cancelled.', data: order });
});

// @route   PUT /api/v1/orders/:id/return-request
export const requestReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId, reason } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);
  if (String(order.user) !== req.user!.id) throw new AppError('Not authorized.', 403);

  const item = order.items.find((i) => String(i._id) === itemId);
  if (!item) throw new AppError('Order item not found.', 404);
  if (item.status !== 'delivered') throw new AppError('Only delivered items can be returned.', 400);

  item.returnRequested = true;
  item.returnReason = reason;
  item.returnRequestedAt = new Date();
  await order.save();

  res.status(200).json({ success: true, message: 'Return request submitted.', data: order });
});

// @route   GET /api/v1/orders (Admin – all orders)
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (search) filter.orderNumber = { $regex: String(search), $options: 'i' };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// @route   PUT /api/v1/orders/:id/status (Admin/Vendor)
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, trackingNumber, trackingUrl, itemId } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404);

  if (itemId) {
    // Update individual item status (vendor)
    const item = order.items.find((i) => String(i._id) === itemId);
    if (!item) throw new AppError('Order item not found.', 404);
    item.status = status;
    if (trackingNumber) item.trackingNumber = trackingNumber;
    if (trackingUrl) item.trackingUrl = trackingUrl;
    if (status === 'shipped') item.shippedAt = new Date();
    if (status === 'delivered') item.deliveredAt = new Date();

    // Intelligently sync overall order status based on items status
    const allStatuses = order.items.map((i) => i.status);
    const uniqueStatuses = Array.from(new Set(allStatuses));

    if (uniqueStatuses.length === 1) {
      order.status = uniqueStatuses[0];
      if (order.status === 'delivered') order.deliveredAt = new Date();
    } else {
      if (allStatuses.every(s => ['delivered', 'shipped'].includes(s))) {
        order.status = 'shipped';
      } else {
        order.status = 'processing';
      }
    }
  } else {
    // Update entire order status
    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    // Sync all items to match
    order.items.forEach((item) => {
      item.status = status;
      if (status === 'shipped') item.shippedAt = new Date();
      if (status === 'delivered') item.deliveredAt = new Date();
    });
  }

  await order.save();

  await Notification.create({
    user: order.user,
    title: `Order ${status.replace('_', ' ')}`,
    body: `Your order #${order.orderNumber} status updated to ${status.replace(/_/g, ' ')}.`,
    type: 'order',
    link: `/orders/${order._id}`,
  });

  res.status(200).json({ success: true, message: 'Order status updated.', data: order });
});

// @route   GET /api/v1/orders/:id/invoice
export const downloadInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name')
    .populate('items.variant', 'color size');

  if (!order) throw new AppError('Order not found.', 404);
  if (req.user!.role === 'customer' && String(order.user) !== req.user!.id) {
    throw new AppError('Not authorized.', 403);
  }

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(24).fillColor('#C9A84C').text('STYLEVERSE', { align: 'center' });
  doc.fontSize(10).fillColor('#666').text('Wear Your World', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).fillColor('#000').text('INVOICE', { align: 'center' });
  doc.moveDown();

  // Invoice info
  doc.fontSize(10).fillColor('#333');
  doc.text(`Invoice Number: ${order.invoiceNumber}`);
  doc.text(`Order Number: ${order.orderNumber}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
  doc.moveDown();

  // Customer info
  doc.fontSize(12).fillColor('#000').text('Bill To:');
  doc.fontSize(10).fillColor('#333');
  doc.text(`${order.shippingAddress.name}`);
  doc.text(`${order.shippingAddress.addressLine1}`);
  if (order.shippingAddress.addressLine2) doc.text(order.shippingAddress.addressLine2);
  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} – ${order.shippingAddress.pincode}`);
  doc.text(`Phone: ${order.shippingAddress.phone}`);
  doc.moveDown();

  // Items table header
  doc.fontSize(11).fillColor('#000');
  doc.rect(50, doc.y, 510, 20).fill('#f0f0f0').stroke('#ccc');
  doc.fillColor('#000')
    .text('Item', 55, doc.y - 15)
    .text('Qty', 310, doc.y - 30)
    .text('Price', 360, doc.y - 30)
    .text('Total', 450, doc.y - 30);
  doc.moveDown();

  // Items
  doc.fontSize(9).fillColor('#333');
  for (const item of order.items) {
    const name = (item.product as any)?.name || item.name;
    const variant = `${item.color || ''} ${item.size || ''}`.trim();
    doc.text(`${name}${variant ? ` (${variant})` : ''}`, 55, doc.y, { width: 250 });
    doc.text(String(item.quantity), 310, doc.y - 12);
    doc.text(`₹${item.price.toLocaleString('en-IN')}`, 360, doc.y - 12);
    doc.text(`₹${item.total.toLocaleString('en-IN')}`, 450, doc.y - 12);
    doc.moveDown(0.5);
  }

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#ccc');
  doc.moveDown(0.5);

  // Totals
  const totalsX = 360;
  doc.fontSize(10).fillColor('#333');
  doc.text('Subtotal:', totalsX).text(`₹${order.subtotal.toLocaleString('en-IN')}`, 460, doc.y - 12);
  if (order.discount > 0) {
    doc.text('Discount:', totalsX).text(`-₹${order.discount.toLocaleString('en-IN')}`, 460, doc.y - 12);
  }
  if (order.couponDiscount > 0) {
    doc.text('Coupon:', totalsX).text(`-₹${order.couponDiscount.toLocaleString('en-IN')}`, 460, doc.y - 12);
  }
  doc.text('Shipping:', totalsX).text(`₹${order.shippingFee.toLocaleString('en-IN')}`, 460, doc.y - 12);
  doc.text(`GST (${order.tax > 0 ? Math.round((order.tax / (order.total - order.shippingFee - order.tax)) * 100) : 18}%):`, totalsX).text(`₹${order.tax.toLocaleString('en-IN')}`, 460, doc.y - 12);
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#000');
  doc.text('TOTAL:', totalsX).text(`₹${order.total.toLocaleString('en-IN')}`, 460, doc.y - 14);
  doc.moveDown(2);

  // Footer
  doc.fontSize(9).fillColor('#999')
    .text('Thank you for shopping with StyleVerse!', { align: 'center' })
    .text('support@styleverse.com | www.styleverse.com', { align: 'center' });

  doc.end();
});

// Vendor orders
export const getVendorOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, status } = req.query;

  const filter: Record<string, unknown> = {};

  if (req.user!.role !== 'admin' && req.user!.role !== 'support') {
    const vendor = await Vendor.findOne({ user: req.user!.id });
    if (!vendor) throw new AppError('Vendor not found.', 404);
    filter['items.vendor'] = vendor._id;
  }

  if (status) filter['items.status'] = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});
