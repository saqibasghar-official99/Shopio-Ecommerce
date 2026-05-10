import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

const AdminUserSchema = new Schema<IAdminUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password_hash: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, default: 'admin' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

AdminUserSchema.index({ email: 1 });

export default mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
