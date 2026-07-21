import { Router } from 'express';
import {
  getAdminAnalytics,
  getVendorAnalytics,
  exportOrdersCSV,
  getActivityLogs,
} from '../controllers/report.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/admin/overview', protect, authorize('admin'), getAdminAnalytics);
router.get('/vendor/analytics', protect, authorize('vendor', 'admin', 'support'), getVendorAnalytics);
router.get('/export/orders', protect, authorize('admin'), exportOrdersCSV);
router.get('/activity-logs', protect, authorize('admin'), getActivityLogs);

export default router;
