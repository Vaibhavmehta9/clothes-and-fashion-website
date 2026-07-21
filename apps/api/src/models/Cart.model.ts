import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItemDocument {
  product: mongoose.Types.ObjectId;
  variant: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  mrp: number;
}

export interface ICartDocument extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItemDocument[];
  coupon?: mongoose.Types.ObjectId;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItemDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
  },
  { _id: true }
);

const cartSchema = new Schema<ICartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 99 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum: number, item: ICartItemDocument) => sum + item.mrp * item.quantity, 0);
  this.discount = this.items.reduce(
    (sum: number, item: ICartItemDocument) => sum + (item.mrp - item.price) * item.quantity,
    0
  );
  this.shippingFee = this.subtotal - this.discount >= 999 ? 0 : 99;
  this.total = this.subtotal - this.discount - this.couponDiscount + this.shippingFee;
};

cartSchema.index({ user: 1 });

export const Cart = mongoose.model<ICartDocument>('Cart', cartSchema);
