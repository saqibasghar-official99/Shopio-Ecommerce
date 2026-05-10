import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  expires_at: Date | null;
  is_active: boolean;
  is_visible: boolean;
  created_at: Date;
  updated_at: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, required: true, enum: ['percent', 'fixed'] },
  value: { type: Number, required: true, min: 0 },
  min_order: { type: Number, default: 0, min: 0 },
  max_uses: { type: Number, default: 0, min: 0 },
  used_count: { type: Number, default: 0, min: 0 },
  expires_at: { type: Date, default: null },
  is_active: { type: Boolean, default: true },
  is_visible: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CouponSchema.index({ code: 1 });

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
