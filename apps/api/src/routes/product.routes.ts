import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getHomepageProducts,
  approveProduct,
  searchProducts,
} from '../controllers/product.controller';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/homepage', getHomepageProducts);
router.get('/search', searchProducts);
router.get('/', optionalAuth, getProducts);
router.get('/:slug', optionalAuth, getProduct);
router.post('/', protect, authorize('vendor', 'admin'), createProduct);
router.put('/:id', protect, authorize('vendor', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('vendor', 'admin'), deleteProduct);
router.put('/:id/approve', protect, authorize('admin'), approveProduct);

export default router;
