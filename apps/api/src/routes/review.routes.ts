import { Router } from 'express';
import {
  createReview, getProductReviews, markReviewHelpful, moderateReview, getAllReviews,
  createQuestion, getProductQuestions, addAnswer,
} from '../controllers/review.controller';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Reviews
router.get('/', getProductReviews);
router.post('/', protect, createReview);
router.put('/:id/helpful', protect, markReviewHelpful);
router.put('/:id/moderate', protect, authorize('admin'), moderateReview);
router.get('/admin/all', protect, authorize('admin'), getAllReviews);

// Questions
router.get('/questions', getProductQuestions);
router.post('/questions', protect, createQuestion);
router.post('/questions/:id/answers', protect, addAnswer);

export default router;
