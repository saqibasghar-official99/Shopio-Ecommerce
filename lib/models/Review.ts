import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  product_id: mongoose.Types.ObjectId;
  customer_id: mongoose.Types.ObjectId | null;
  customer_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: Date;
  updated_at: Date;
}

const ReviewSchema = new Schema<IReview>({
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
  customer_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  is_approved: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

ReviewSchema.index({ product_id: 1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
