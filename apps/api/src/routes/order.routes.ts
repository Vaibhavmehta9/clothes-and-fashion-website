import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  requestReturn,
  getAllOrders,
  updateOrderStatus,
  downloadInvoice,
  getVendorOrders,
} from '../controllers/order.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Static / collection routes FIRST (before /:id)
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/vendor/orders', protect, authorize('vendor', 'admin', 'support'), getVendorOrders);

// Admin routes (collection)
router.get('/', protect, authorize('admin', 'support'), getAllOrders);

// Dynamic /:id routes LAST
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/return-request', protect, requestReturn);
router.get('/:id/invoice', protect, downloadInvoice);
router.put('/:id/status', protect, authorize('admin', 'vendor', 'support'), updateOrderStatus);

export default router;
