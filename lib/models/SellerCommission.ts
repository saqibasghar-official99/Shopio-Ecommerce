import mongoose, { Document, Schema } from 'mongoose';

export type CommissionStatus = 'pending' | 'available' | 'paid' | 'reversed' | 'disputed';

export interface ISellerCommission extends Document {
  seller_id: mongoose.Types.ObjectId;
  order_id: mongoose.Types.ObjectId;
  order_number: string;
  earning_type: 'commission' | 'profit';
  eligible_amount: number;
  amount: number;
  original_amount: number;
  rate: number;
  status: CommissionStatus;
  created_at: Date;
  updated_at: Date;
}

const SellerCommissionSchema = new Schema<ISellerCommission>(
  {
    seller_id: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    order_number: { type: String, required: true },
    earning_type: { type: String, enum: ['commission', 'profit'], default: 'commission' },
    eligible_amount: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    original_amount: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['pending', 'available', 'paid', 'reversed', 'disputed'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

SellerCommissionSchema.index({ seller_id: 1, status: 1, created_at: -1 });

export default mongoose.models.SellerCommission ||
  mongoose.model<ISellerCommission>('SellerCommission', SellerCommissionSchema);
