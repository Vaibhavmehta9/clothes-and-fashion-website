import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Cart } from '../models/Cart.model';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Coupon } from '../models/Coupon.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

const calculateCart = async (cart: InstanceType<typeof Cart>) => {
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  cart.discount = cart.items.reduce((sum, item) => sum + (item.mrp - item.price) * item.quantity, 0);
  const effectiveTotal = cart.subtotal - cart.discount - cart.couponDiscount;
  cart.shippingFee = effectiveTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  cart.total = effectiveTotal + cart.shippingFee;
  await cart.save();
};

// @route   GET /api/v1/cart
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  let cart = await Cart.findOne({ user: req.user!.id })
    .populate({ path: 'items.product', select: 'name slug thumbnail status vendor isActive', populate: { path: 'vendor', select: 'storeName' } })
    .populate('items.variant', 'color size material price mrp discount stock images')
    .populate('coupon', 'code type value');

  if (!cart) {
    cart = await Cart.create({ user: req.user!.id, items: [] });
  }

  res.status(200).json({ success: true, data: cart });
});

// @route   POST /api/v1/cart/add
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, variantId, quantity = 1 } = req.body;

  const [product, variant] = await Promise.all([
    Product.findById(productId),
    ProductVariant.findById(variantId),
  ]);

  if (!product || product.status !== 'active') throw new AppError('Product not available.', 404);
  if (!variant || !variant.isActive) throw new AppError('Variant not available.', 404);
  if (variant.stock < quantity) throw new AppError(`Only ${variant.stock} items in stock.`, 400);

  let cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) cart = await Cart.create({ user: req.user!.id, items: [] });

  const existingIdx = cart.items.findIndex(
    (i) => String(i.product) === productId && String(i.variant) === variantId
  );

  if (existingIdx > -1) {
    const newQty = cart.items[existingIdx].quantity + quantity;
    if (newQty > 10) throw new AppError('Maximum 10 units per item allowed.', 400);
    if (newQty > variant.stock) throw new AppError(`Only ${variant.stock} items in stock.`, 400);
    cart.items[existingIdx].quantity = newQty;
  } else {
    if (cart.items.length >= 50) throw new AppError('Cart is full (max 50 items).', 400);
    cart.items.push({
      product: product._id as any,
      variant: variant._id as any,
      quantity,
      price: variant.price,
      mrp: variant.mrp,
    });
  }

  await calculateCart(cart);

  const populated = await Cart.findOne({ user: req.user!.id })
    .populate({ path: 'items.product', select: 'name slug thumbnail vendor', populate: { path: 'vendor', select: 'storeName' } })
    .populate('items.variant', 'color size price mrp discount stock images');

  res.status(200).json({ success: true, message: 'Added to cart.', data: populated });
});

// @route   PUT /api/v1/cart/:itemId
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) throw new AppError('Cart not found.', 404);

  const item = cart.items.find((i) => String(i._id) === itemId);
  if (!item) throw new AppError('Item not found in cart.', 404);

  if (quantity === 0) {
    cart.items = cart.items.filter((i) => String(i._id) !== itemId) as any;
  } else {
    const variant = await ProductVariant.findById(item.variant);
    if (!variant || variant.stock < quantity) {
      throw new AppError(`Only ${variant?.stock || 0} items in stock.`, 400);
    }
    item.quantity = Math.min(quantity, 10);
    item.price = variant.price;
    item.mrp = variant.mrp;
  }

  await calculateCart(cart);

  res.status(200).json({ success: true, message: 'Cart updated.', data: cart });
});

// @route   DELETE /api/v1/cart/:itemId
export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) throw new AppError('Cart not found.', 404);

  cart.items = cart.items.filter((i) => String(i._id) !== req.params.itemId) as any;
  await calculateCart(cart);

  res.status(200).json({ success: true, message: 'Item removed from cart.', data: cart });
});

// @route   DELETE /api/v1/cart
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Cart.findOneAndUpdate(
    { user: req.user!.id },
    { items: [], subtotal: 0, discount: 0, couponDiscount: 0, shippingFee: 0, total: 0, coupon: undefined },
    { upsert: true }
  );

  res.status(200).json({ success: true, message: 'Cart cleared.' });
});

// @route   POST /api/v1/cart/coupon
export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;

  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty.', 400);

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new AppError('Invalid coupon code.', 404);
  if (coupon.expiresAt < new Date()) throw new AppError('Coupon has expired.', 400);
  if (coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached.', 400);
  if (coupon.usedBy?.includes(req.user!.id as any)) throw new AppError('Coupon already used.', 400);

  const subtotal = cart.subtotal - cart.discount;
  if (subtotal < coupon.minOrderAmount) {
    throw new AppError(`Minimum order amount ₹${coupon.minOrderAmount} required.`, 400);
  }

  let couponDiscount = 0;
  if (coupon.type === 'percentage') {
    couponDiscount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
  } else if (coupon.type === 'fixed') {
    couponDiscount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'free_shipping') {
    couponDiscount = cart.shippingFee;
  }

  cart.coupon = coupon._id as any;
  cart.couponDiscount = Math.round(couponDiscount);
  await calculateCart(cart);

  res.status(200).json({
    success: true,
    message: `Coupon applied! You saved ₹${cart.couponDiscount}`,
    data: { cart, couponDiscount: cart.couponDiscount },
  });
});

// @route   DELETE /api/v1/cart/coupon
export const removeCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) throw new AppError('Cart not found.', 404);

  cart.coupon = undefined;
  cart.couponDiscount = 0;
  await calculateCart(cart);

  res.status(200).json({ success: true, message: 'Coupon removed.', data: cart });
});
