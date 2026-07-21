import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandDocument extends Document {
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  isFeatured: boolean;
  productCount: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrandDocument>(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      unique: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    logo: String,
    banner: String,
    description: { type: String, maxlength: 500 },
    website: String,
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    productCount: { type: Number, default: 0 },
    seo: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String,
    },
  },
  { timestamps: true }
);

brandSchema.index({ slug: 1 });
brandSchema.index({ isFeatured: 1, isActive: 1 });

export const Brand = mongoose.model<IBrandDocument>('Brand', brandSchema);
