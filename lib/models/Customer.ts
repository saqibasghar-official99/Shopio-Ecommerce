import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  address: string;
  city: string;
  is_guest: boolean;
  created_at: Date;
  updated_at: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, default: '' },
  password_hash: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  is_guest: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

CustomerSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
