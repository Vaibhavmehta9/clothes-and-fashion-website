import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewDocument extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  body: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  helpfulCount: number;
  helpfulVotes: mongoose.Types.ObjectId[];
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 100 },
    body: { type: String, required: true, minlength: 10, maxlength: 2000 },
    images: [String],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    helpfulCount: { type: Number, default: 0 },
    helpfulVotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate reviews
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1 });

// Update product rating after review save
reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, status: 'approved' } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
});

export const Review = mongoose.model<IReviewDocument>('Review', reviewSchema);
