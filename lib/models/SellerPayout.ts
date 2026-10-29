import mongoose, { Document, Schema } from 'mongoose';

export interface ISellerPayout extends Document {
  seller_id: mongoose.Types.ObjectId;
  amount: number;
  status: 'requested' | 'processing' | 'paid' | 'rejected';
  method: string;
  reference: string;
  note: string;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const SellerPayoutSchema = new Schema<ISellerPayout>(
  {
    seller_id: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['requested', 'processing', 'paid', 'rejected'],
      default: 'requested',
    },
    method: { type: String, default: '' },
    reference: { type: String, default: '' },
    note: { type: String, default: '' },
    paid_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

SellerPayoutSchema.index({ seller_id:  1, created_at: -1 });

export default mongoose.models.SellerPayout ||
  mongoose.model<ISellerPayout>('SellerPayout', SellerPayoutSchema);
