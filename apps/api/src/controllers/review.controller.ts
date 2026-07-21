import { Response, Request } from 'express';
import asyncHandler from 'express-async-handler';
import { Review } from '../models/Review.model';
import { Question } from '../models/Question.model';
import { Order } from '../models/Order.model';
import { Vendor } from '../models/Vendor.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// ======= REVIEWS =======

// @route   POST /api/v1/reviews
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, rating, title, body, images } = req.body;

  // Check if user has purchased the product
  const order = await Order.findOne({
    user: req.user!.id,
    'items.product': productId,
    status: 'delivered',
  });

  const existingReview = await Review.findOne({ product: productId, user: req.user!.id });
  if (existingReview) throw new AppError('You have already reviewed this product.', 400);

  const review = await Review.create({
    product: productId,
    user: req.user!.id,
    order: order?._id,
    rating,
    title,
    body,
    images: images || [],
    isVerifiedPurchase: !!order,
    status: 'pending', // Requires admin approval
  });

  const populated = await Review.findById(review._id).populate('user', 'name avatar');

  res.status(201).json({
    success: true,
    message: 'Review submitted for approval.',
    data: populated,
  });
});

// @route   GET /api/v1/reviews?product=
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { product, page = 1, limit = 10, sort = 'newest' } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const sortMap: Record<string, Record<string, number>> = {
    newest: { createdAt: -1 },
    highest: { rating: -1 },
    lowest: { rating: 1 },
    helpful: { helpfulCount: -1 },
  };

  const [reviews, total, ratingStats] = await Promise.all([
    Review.find({ product, status: 'approved' })
      .sort(sortMap[String(sort)] || { createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name avatar'),
    Review.countDocuments({ product, status: 'approved' }),
    Review.aggregate([
      { $match: { product: new (require('mongoose').Types.ObjectId)(String(product)), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
  ]);

  // Format rating breakdown
  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingStats.forEach((s: { _id: number; count: number }) => {
    breakdown[s._id] = s.count;
  });

  res.status(200).json({
    success: true,
    data: reviews,
    ratingBreakdown: breakdown,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// @route   PUT /api/v1/reviews/:id/helpful
export const markReviewHelpful = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found.', 404);

  const hasVoted = review.helpfulVotes?.includes(req.user!.id as any);
  if (hasVoted) {
    review.helpfulVotes = review.helpfulVotes?.filter((id) => String(id) !== req.user!.id) as any;
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulVotes?.push(req.user!.id as any);
    review.helpfulCount += 1;
  }
  await review.save();

  res.status(200).json({ success: true, data: { helpfulCount: review.helpfulCount } });
});

// @route   PUT /api/v1/reviews/:id/moderate (Admin)
export const moderateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, rejectionReason } = req.body;

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status, ...(rejectionReason && { rejectionReason }) },
    { new: true }
  ).populate('user', 'name email');

  if (!review) throw new AppError('Review not found.', 404);

  res.status(200).json({ success: true, message: `Review ${status}.`, data: review });
});

// @route   GET /api/v1/reviews (Admin – all pending)
export const getAllReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, status } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name email avatar')
      .populate('product', 'name slug thumbnail'),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// ======= QUESTIONS & ANSWERS =======

// @route   POST /api/v1/questions
export const createQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, question } = req.body;

  const q = await Question.create({
    product: productId,
    user: req.user!.id,
    question,
  });

  const populated = await Question.findById(q._id).populate('user', 'name avatar');
  res.status(201).json({ success: true, message: 'Question submitted.', data: populated });
});

// @route   GET /api/v1/questions?product=
export const getProductQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { product, page = 1, limit = 10 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [questions, total] = await Promise.all([
    Question.find({ product })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name avatar')
      .populate('answers.user', 'name avatar'),
    Question.countDocuments({ product }),
  ]);

  res.status(200).json({
    success: true,
    data: questions,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// @route   POST /api/v1/questions/:id/answers
export const addAnswer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { answer } = req.body;

  const vendor = await Vendor.findOne({ user: req.user!.id });
  const isVendor = !!vendor;

  const question = await Question.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        answers: {
          user: req.user!.id,
          ...(isVendor && { vendor: vendor._id }),
          isVendor,
          answer,
        },
      },
      isAnswered: true,
    },
    { new: true }
  )
    .populate('user', 'name avatar')
    .populate('answers.user', 'name avatar');

  if (!question) throw new AppError('Question not found.', 404);

  res.status(201).json({ success: true, message: 'Answer added.', data: question });
});
