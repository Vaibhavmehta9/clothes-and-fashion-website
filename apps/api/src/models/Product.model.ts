import mongoose, { Document, Schema } from 'mongoose';

export interface IProductDocument extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  images: string[];
  thumbnail: string;
  variants: mongoose.Types.ObjectId[];
  basePrice: number;
  baseMrp: number;
  baseDiscount: number;
  tags: string[];
  status: 'draft' | 'pending' | 'active' | 'inactive' | 'rejected';
  rejectionReason?: string;
  rating: number;
  reviewCount: number;
  wishlistCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  saleEndsAt?: Date;
  viewCount: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: 50,
    },
    shortDescription: { type: String, maxlength: 200 },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor is required'],
    },
    images: [{ type: String }],
    thumbnail: {
      type: String,
      required: [true, 'Thumbnail is required'],
    },
    variants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariant',
      },
    ],
    basePrice: { type: Number, required: true, min: 0 },
    baseMrp: { type: Number, required: true, min: 0 },
    baseDiscount: { type: Number, default: 0, min: 0, max: 100 },
    tags: [{ type: String, lowercase: true }],
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'inactive', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    saleEndsAt: Date,
    viewCount: { type: Number, default: 0 },
    seo: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Full-text search index
productSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, tags: 5, description: 1 } }
);

productSchema.index({ slug: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ isNewArrival: 1, status: 1 });
productSchema.index({ isTrending: 1, status: 1 });
productSchema.index({ isBestSeller: 1, status: 1 });
productSchema.index({ createdAt: -1 });

export const Product = mongoose.model<IProductDocument>('Product', productSchema);
