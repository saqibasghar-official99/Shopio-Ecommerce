import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  store_name: string;
  logo: string;
  phone: string;
  whatsapp_number: string;
  whatsapp_message: string;
  address: string;
  currency: string;
  social_links: Record<string, string>;
  meta_title: string;
  meta_desc: string;
  banners: { image: string; link: string; isActive: boolean }[];
  announcement_bar: { text: string; isActive: boolean };
  shipping_policy: string;
  return_policy: string;
  about_text: string;
  created_at: Date;
  updated_at: Date;
}

const BannerSchema = new Schema({
  image: { type: String, default: '' },
  link: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const SiteSettingsSchema = new Schema<ISiteSettings>({
  store_name: { type: String, default: 'ShopEase' },
  logo: { type: String, default: '' },
  phone: { type: String, default: '' },
  whatsapp_number: { type: String, default: '' },
  whatsapp_message: { type: String, default: '' },
  address: { type: String, default: '' },
  currency: { type: String, default: '$' },
  social_links: { type: Schema.Types.Mixed, default: {} },
  meta_title: { type: String, default: '' },
  meta_desc: { type: String, default: '' },
  banners: [BannerSchema],
  announcement_bar: { text: { type: String, default: '' }, isActive: { type: Boolean, default: false } },
  shipping_policy: { type: String, default: '' },
  return_policy: { type: String, default: '' },
  about_text: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
