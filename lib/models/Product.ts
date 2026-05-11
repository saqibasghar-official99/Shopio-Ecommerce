import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: mongoose.Types.ObjectId;
  price: number;
  compare_price: number;
  cost: number;
  images: string[];
  stock: number;
  sku: string;
  weight: number;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  specifications: { key: string; value: string }[];
  ratings_avg: number;
  ratings_count: number;
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  short_description: { type: String, default: '' },
  category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true, min: 0 },
  compare_price: { type: Number, default: 0, min: 0 },
  cost: { type: Number, default: 0, min: 0 },
  images: [{ type: String }],
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String, default: '' },
  weight: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  is_featured: { type: Boolean, default: false },
  tags: [{ type: String }],
  specifications: [{ key: { type: String, required: true }, value: { type: String, required: true } }],
  ratings_avg: { type: Number, default: 0 },
  ratings_count: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes for the common storefront query patterns
ProductSchema.index({ is_active: 1, created_at: -1 });
ProductSchema.index({ is_active: 1, is_featured: 1, created_at: -1 });
ProductSchema.index({ is_active: 1, category_id: 1, created_at: -1 });
ProductSchema.index({ is_active: 1, price: 1 });
ProductSchema.index({ is_active: 1, ratings_count: -1 });
ProductSchema.index({ tags: 1 });
// Full-text index for fast search instead of slow $regex scans
ProductSchema.index({ name: 'text', description: 'text', short_description: 'text', tags: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
