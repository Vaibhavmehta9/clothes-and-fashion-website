import { Router } from 'express';
import {
  toggleWishlist, getWishlist, removeFromWishlist, clearWishlist,
  getNotifications, markAllNotificationsRead, markNotificationRead,
} from '../controllers/wishlist.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// Wishlist
router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/', clearWishlist);
router.delete('/:productId', removeFromWishlist);

// Notifications (same auth level)
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);

export default router;
