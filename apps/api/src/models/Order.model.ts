import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItemDocument {
  _id: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  variant: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  name: string;
  thumbnail: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  mrp: number;
  discount: number;
  total: number;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  returnRequested: boolean;
  returnReason?: string;
  returnRequestedAt?: Date;
  refundAmount?: number;
  refundedAt?: Date;
}

export interface IOrderDocument extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItemDocument[];
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingFee: number;
  tax: number;
  total: number;
  coupon?: mongoose.Types.ObjectId;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  razorpayOrderId?: string;
  status: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  invoiceNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItemDocument>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  thumbnail: { type: String, required: true },
  color: String,
  size: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending',
  },
  trackingNumber: String,
  trackingUrl: String,
  shippedAt: Date,
  deliveredAt: Date,
  returnRequested: { type: Boolean, default: false },
  returnReason: String,
  returnRequestedAt: Date,
  refundAmount: Number,
  refundedAt: Date,
});

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay', 'stripe', 'wallet', 'upi'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: String,
    razorpayOrderId: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
      default: 'pending',
    },
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// Generate invoice number
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.invoiceNumber = `INV-${year}-${random}`;
  }
  next();
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.vendor': 1 });

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
