import mongoose, { Document, Schema } from 'mongoose';

export type SellerPayoutProvider =
  | 'nayapay'
  | 'jazzcash'
  | 'easypaisa'
  | 'meezan_bank'
  | 'hbl'
  | 'sadapay';

export interface ISellerPayoutMethod extends Document {
  seller_id: mongoose.Types.ObjectId;
  provider: SellerPayoutProvider;
  encrypted_details: string;
  last_four: string;
  status: 'pending_review' | 'reviewed' | 'needs_update';
  review_note: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

const SellerPayoutMethodSchema = new Schema<ISellerPayoutMethod>(
  {
    seller_id: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    provider: {
      type: String,
      enum: ['nayapay', 'jazzcash', 'easypaisa', 'meezan_bank', 'hbl', 'sadapay'],
      required: true,
    },
    encrypted_details: { type: String, required: true, select: false },
    last_four: { type: String, required: true },
    status: { type: String, enum: ['pending_review', 'reviewed', 'needs_update'], default: 'pending_review' },
    review_note: { type: String, default: '', maxlength: 500 },
    is_default: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

SellerPayoutMethodSchema.index({ seller_id: 1, provider: 1 }, { unique: true });
SellerPayoutMethodSchema.index({ seller_id: 1, created_at: -1 });

export default mongoose.models.SellerPayoutMethod ||
  mongoose.model<ISellerPayoutMethod>('SellerPayoutMethod', SellerPayoutMethodSchema);
