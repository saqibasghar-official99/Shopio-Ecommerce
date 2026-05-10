import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  order_id: mongoose.Types.ObjectId;
  order_number: string;
  type: 'income' | 'expense' | 'refund';
  amount: number;
  description: string;
  created_at: Date;
  updated_at: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  order_number: { type: String, required: true },
  type: { type: String, required: true, enum: ['income', 'expense', 'refund'] },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

TransactionSchema.index({ order_id: 1 });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
