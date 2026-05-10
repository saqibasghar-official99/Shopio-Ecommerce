import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
  parent_id: mongoose.Types.ObjectId | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  parent_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CategorySchema.index({ slug: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
