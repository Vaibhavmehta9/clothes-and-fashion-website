import { Router } from 'express';
import {
  registerVendor, getVendorProfile, updateVendorProfile,
  getAllVendors, approveVendor, getVendorBySlug,
} from '../controllers/vendor.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', protect, registerVendor);
router.get('/profile', protect, authorize('vendor', 'admin'), getVendorProfile);
router.put('/profile', protect, authorize('vendor', 'admin'), updateVendorProfile);
router.get('/:slug', getVendorBySlug);

// Admin
router.get('/', protect, authorize('admin'), getAllVendors);
router.put('/:id/approve', protect, authorize('admin'), approveVendor);

export default router;
