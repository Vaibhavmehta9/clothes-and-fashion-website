import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '../models/User.model';
import { Product } from '../models/Product.model';
import { Notification } from '../models/Notification.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// @route   POST /api/v1/wishlist/toggle
export const toggleWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.body;

  const user = await User.findById(req.user!.id).select('wishlist');
  if (!user) throw new AppError('User not found.', 404);

  const isWishlisted = user.wishlist.includes(productId);

  if (isWishlisted) {
    user.wishlist = user.wishlist.filter((id) => String(id) !== productId) as any;
  } else {
    user.wishlist.push(productId);
    // Decrement product wishlistCount
    await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } });
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: isWishlisted ? 'Removed from wishlist.' : 'Added to wishlist.',
    data: { isWishlisted: !isWishlisted, wishlistCount: user.wishlist.length },
  });
});

// @route   GET /api/v1/wishlist
export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const user = await User.findById(req.user!.id)
    .select('wishlist')
    .populate({
      path: 'wishlist',
      options: { skip: (pageNum - 1) * limitNum, limit: limitNum },
      select: 'name slug thumbnail basePrice baseMrp baseDiscount rating reviewCount isOnSale',
      match: { status: 'active' },
    });

  if (!user) throw new AppError('User not found.', 404);

  res.status(200).json({
    success: true,
    data: user.wishlist,
    pagination: {
      total: user.wishlist.length,
      page: pageNum,
      limit: limitNum,
    },
  });
});

// @route   DELETE /api/v1/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  await User.findByIdAndUpdate(req.user!.id, {
    $pull: { wishlist: req.params.productId },
  });

  res.status(200).json({ success: true, message: 'Removed from wishlist.' });
});

// @route   DELETE /api/v1/wishlist
export const clearWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  await User.findByIdAndUpdate(req.user!.id, { wishlist: [] });
  res.status(200).json({ success: true, message: 'Wishlist cleared.' });
});

// @route   GET /api/v1/notifications
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments({ user: req.user!.id }),
    Notification.countDocuments({ user: req.user!.id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// @route   PUT /api/v1/notifications/read-all
export const markAllNotificationsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ user: req.user!.id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

// @route   PUT /api/v1/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { isRead: true }
  );
  res.status(200).json({ success: true, message: 'Notification marked as read.' });
});
