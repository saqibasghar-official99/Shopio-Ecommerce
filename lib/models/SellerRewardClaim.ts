import mongoose, { Document, Schema } from 'mongoose';

export interface ISellerRewardClaim extends Document {
  seller_id: mongoose.Types.ObjectId;
  gift_id: mongoose.Types.ObjectId;
  month_key: string;
  claim_number: number;
  status: 'claimed' | 'processing' | 'shipped' | 'fulfilled' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

const SellerRewardClaimSchema = new Schema<ISellerRewardClaim>(
  {
    seller_id: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    gift_id: { type: Schema.Types.ObjectId, ref: 'SellerGift', required: true },
    month_key: { type: String, required: true },
    claim_number: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['claimed', 'processing', 'shipped', 'fulfilled', 'cancelled'],
      default: 'claimed',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

SellerRewardClaimSchema.index(
  { seller_id: 1, month_key: 1, claim_number: 1 },
  { unique: true }
);

export default mongoose.models.SellerRewardClaim ||
  mongoose.model<ISellerRewardClaim>('SellerRewardClaim', SellerRewardClaimSchema);
