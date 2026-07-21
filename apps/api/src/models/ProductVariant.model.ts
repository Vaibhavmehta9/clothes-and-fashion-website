import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariantDocument extends Document {
  product: mongoose.Types.ObjectId;
  color?: string;
  colorCode?: string;
  size?: string;
  material?: string;
  fit?: string;
  pattern?: string;
  sleeve?: string;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  sku: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariantDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    color: { type: String, trim: true },
    colorCode: String,
    size: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '6', '7', '8', '9', '10', '11', '12', 'Free Size'] },
    material: String,
    fit: String,
    pattern: String,
    sleeve: String,
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-calculate discount
productVariantSchema.pre('save', function (next) {
  if (this.mrp > 0 && this.price < this.mrp) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  } else {
    this.discount = 0;
  }
  next();
});

productVariantSchema.index({ product: 1 });
productVariantSchema.index({ sku: 1 });
productVariantSchema.index({ color: 1, size: 1 });

export const ProductVariant = mongoose.model<IProductVariantDocument>('ProductVariant', productVariantSchema);
