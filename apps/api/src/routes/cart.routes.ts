import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon } from '../controllers/cart.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);
router.post('/coupon', applyCoupon);
router.delete('/coupon/remove', removeCoupon);

export default router;
