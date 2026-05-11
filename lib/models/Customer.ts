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

// Add a non-unique compound index later if needed; the primary email index
// is implicit from the field definition. Keep schema lean to avoid duplicate
// index warnings on cold start.
CustomerSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'email_unique' });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
