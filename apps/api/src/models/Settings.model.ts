import mongoose, { Document, Schema } from 'mongoose';

export interface ISettingsDocument extends Document {
  siteName: string;
  siteTagline: string;
  logo: string;
  favicon: string;
  currency: string;
  currencySymbol: string;
  tax: number;
  shippingFee: number;
  freeShippingThreshold: number;
  defaultCommissionRate: number;
  maintenanceMode: boolean;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    pinterest?: string;
  };
  paymentMethods: {
    cod: boolean;
    razorpay: boolean;
    stripe: boolean;
    upi: boolean;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };
  analyticsId?: string;
  metaPixelId?: string;
}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    siteName: { type: String, default: 'StyleVerse' },
    siteTagline: { type: String, default: 'Wear Your World' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    tax: { type: Number, default: 18 },
    shippingFee: { type: Number, default: 99 },
    freeShippingThreshold: { type: Number, default: 999 },
    defaultCommissionRate: { type: Number, default: 10 },
    maintenanceMode: { type: Boolean, default: false },
    contactEmail: { type: String, default: 'support@styleverse.com' },
    contactPhone: { type: String, default: '+91 9000000000' },
    address: { type: String, default: 'Mumbai, Maharashtra, India' },
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
      pinterest: String,
    },
    paymentMethods: {
      cod: { type: Boolean, default: true },
      razorpay: { type: Boolean, default: true },
      stripe: { type: Boolean, default: false },
      upi: { type: Boolean, default: true },
    },
    seo: {
      title: { type: String, default: 'StyleVerse – Wear Your World' },
      description: { type: String, default: 'India\'s premier multi-vendor fashion marketplace' },
      keywords: { type: [String], default: ['fashion', 'clothing', 'online shopping'] },
      ogImage: String,
    },
    analyticsId: String,
    metaPixelId: String,
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettingsDocument>('Settings', settingsSchema);
