import { Router } from 'express';
import {
  getAllTickets,
  getMyTickets,
  createTicket,
  getTicketDetails,
  replyToTicket,
  updateTicket,
  closeMyTicket,
} from '../controllers/support.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Customer routes
router.post('/', protect, authorize('customer'), createTicket);
router.get('/my', protect, authorize('customer'), getMyTickets);

// Admin & Support Staff
router.get('/', protect, authorize('admin', 'support'), getAllTickets);
router.put('/:id', protect, authorize('admin', 'support'), updateTicket);

// Shared – owner / admin / support
router.get('/:id', protect, getTicketDetails);
router.post('/:id/reply', protect, replyToTicket);
router.put('/:id/close', protect, closeMyTicket); // customers can close/resolve their own

export default router;
