import mongoose, { Document, Schema } from 'mongoose';

export interface IBankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface IVendorDocument extends Document {
  user: mongoose.Types.ObjectId;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  storeBanner?: string;
  storeDescription: string;
  businessEmail: string;
  businessPhone: string;
  gstNumber?: string;
  panNumber?: string;
  bankDetails: IBankDetails;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  commissionRate: number;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendorDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    storeSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    storeLogo: String,
    storeBanner: String,
    storeDescription: {
      type: String,
      required: [true, 'Store description is required'],
      minlength: 20,
      maxlength: 1000,
    },
    businessEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    businessPhone: {
      type: String,
      required: true,
    },
    gstNumber: String,
    panNumber: String,
    bankDetails: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    address: {
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    rejectionReason: String,
    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 50,
    },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    socialLinks: {
      instagram: String,
      facebook: String,
      website: String,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
  },
  { timestamps: true }
);

vendorSchema.index({ storeSlug: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ user: 1 });

export const Vendor = mongoose.model<IVendorDocument>('Vendor', vendorSchema);
