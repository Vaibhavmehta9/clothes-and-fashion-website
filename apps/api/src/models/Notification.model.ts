import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationDocument extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: 'order' | 'product' | 'review' | 'system' | 'promo' | 'vendor';
  isRead: boolean;
  link?: string;
  image?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ['order', 'product', 'review', 'system', 'promo', 'vendor'],
      required: true,
    },
    isRead: { type: Boolean, default: false },
    link: String,
    image: String,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
