import mongoose, { Document, Schema } from 'mongoose';

export interface IBannerDocument extends Document {
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  buttonText?: string;
  badge?: string;
  position: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBannerDocument>(
  {
    title: { type: String, required: true, maxlength: 200 },
    subtitle: String,
    image: { type: String, required: true },
    mobileImage: String,
    link: String,
    buttonText: String,
    badge: String,
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, position: 1 });

export const Banner = mongoose.model<IBannerDocument>('Banner', bannerSchema);
