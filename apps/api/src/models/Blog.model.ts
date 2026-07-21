import mongoose, { Document, Schema } from 'mongoose';

export interface IBlogDocument extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  author: mongoose.Types.ObjectId;
  categories: string[];
  tags: string[];
  status: 'draft' | 'published';
  readTime: number;
  viewCount: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlogDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    excerpt: { type: String, maxlength: 500 },
    content: { type: String, required: true },
    coverImage: String,
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categories: [String],
    tags: [String],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    readTime: { type: Number, default: 5 },
    viewCount: { type: Number, default: 0 },
    seo: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String,
    },
    publishedAt: Date,
  },
  { timestamps: true }
);

blogSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  // Calculate read time
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).length;
    this.readTime = Math.ceil(words / 200);
  }
  next();
});

blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });

export const Blog = mongoose.model<IBlogDocument>('Blog', blogSchema);
