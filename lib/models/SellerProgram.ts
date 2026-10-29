import mongoose, { Document, Schema } from 'mongoose';

export interface ICommissionRate {
  product_id?: string;
  category_id?: string;
  rate: number;
}

export interface ISellerProgram extends Document {
  key: string;
  default_commission_rate: number;
  product_rates: ICommissionRate[];
  category_rates: ICommissionRate[];
  monthly_sales_threshold: number;
  monthly_gift_limit: number;
  updated_by: string;
  updated_at: Date;
}

const CommissionRateSchema = new Schema<ICommissionRate>(
  {
    product_id: { type: String, default: '' },
    category_id: { type: String, default: '' },
    rate: { type: Number, min: 0, max: 100, required: true },
  },
  { _id: false }
);

const SellerProgramSchema = new Schema<ISellerProgram>(
  {
    key: { type: String, default: 'default', unique: true },
    default_commission_rate: { type: Number, default: 15, min: 0, max: 100 },
    product_rates: { type: [CommissionRateSchema], default: [] },
    category_rates: { type: [CommissionRateSchema], default: [] },
    monthly_sales_threshold: { type: Number, default: 3, min: 1 },
    monthly_gift_limit: { type: Number, default: 2, min: 0 },
    updated_by: { type: String, default: '' },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

export default mongoose.models.SellerProgram ||
  mongoose.model<ISellerProgram>('SellerProgram', SellerProgramSchema);
