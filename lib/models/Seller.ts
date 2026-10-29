import mongoose, { Document, Schema } from 'mongoose';

export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface ISeller extends Document {
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  referral_code: string;
  status: SellerStatus;
  auto_approve_at?: Date;
  email_verified: boolean;
  email_otp_hash?: string;
  email_otp_expires_at?: Date;
  email_otp_attempts?: number;
  email_otp_resend_count?: number;
  email_otp_resend_window_started_at?: Date;
  email_otp_last_sent_at?: Date;
  password_reset_otp_hash?: string;
  password_reset_otp_expires_at?: Date;
  password_reset_otp_attempts?: number;
  password_reset_resend_count?: number;
  password_reset_resend_window_started_at?: Date;
  password_reset_last_sent_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const SellerSchema = new Schema<ISeller>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    password_hash: { type: String, required: true, select: false },
    referral_code: { type: String, required: true, unique: true, uppercase: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    auto_approve_at: { type: Date },
    email_verified: { type: Boolean, required: true, default: true },
    email_otp_hash: { type: String, select: false },
    email_otp_expires_at: { type: Date, select: false },
    email_otp_attempts: { type: Number, select: false, default: 0 },
    email_otp_resend_count: { type: Number, select: false, default: 0 },
    email_otp_resend_window_started_at: { type: Date, select: false },
    email_otp_last_sent_at: { type: Date, select: false },
    password_reset_otp_hash: { type: String, select: false },
    password_reset_otp_expires_at: { type: Date, select: false },
    password_reset_otp_attempts: { type: Number, select: false, default: 0 },
    password_reset_resend_count: { type: Number, select: false, default: 0 },
    password_reset_resend_window_started_at: { type: Date, select: false },
    password_reset_last_sent_at: { type: Date, select: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

SellerSchema.index({ email: 1 }, { unique: true });
SellerSchema.index({ status: 1, auto_approve_at: 1 });

const cachedSellerModel = mongoose.models.Seller;
if (
  cachedSellerModel &&
  (
    !cachedSellerModel.schema.path('email_verified') ||
    !cachedSellerModel.schema.path('email_otp_hash') ||
    !cachedSellerModel.schema.path('password_reset_otp_hash') ||
    !cachedSellerModel.schema.path('auto_approve_at')
  )
) {
  delete mongoose.models.Seller;
}

export default mongoose.models.Seller || mongoose.model<ISeller>('Seller', SellerSchema);
