import mongoose, { Document, Schema } from 'mongoose';

export interface ISellerGift extends Document {
  name: string;
  description: string;
  image_url: string;
  stock: number;
  internal_cost: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const SellerGiftSchema = new Schema<ISellerGift>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 2000 },
    image_url: { type: String, default: '' },
    stock: { type: Number, default: 0, min: 0 },
    internal_cost: { type: Number, default: 0, min: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

SellerGiftSchema.index({ is_active: 1, stock: 1 });

export default mongoose.models.SellerGift ||
  mongoose.model<ISellerGift>('SellerGift', SellerGiftSchema);
