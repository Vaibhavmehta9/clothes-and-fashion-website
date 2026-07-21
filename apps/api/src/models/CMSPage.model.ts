import mongoose, { Document, Schema } from 'mongoose';

export interface ICMSPageDocument extends Document {
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const cmsPageSchema = new Schema<ICMSPageDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

cmsPageSchema.index({ slug: 1 });

export const CMSPage = mongoose.model<ICMSPageDocument>('CMSPage', cmsPageSchema);
