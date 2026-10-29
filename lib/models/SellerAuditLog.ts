import mongoose, { Document, Schema } from 'mongoose';

export interface ISellerAuditLog extends Document {
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: Date;
}

const SellerAuditLogSchema = new Schema<ISellerAuditLog>(
  {
    actor: { type: String, required: true },
    action: { type: String, required: true },
    target_type: { type: String, required: true },
    target_id: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

SellerAuditLogSchema.index({ created_at: -1 });

export default mongoose.models.SellerAuditLog ||
  mongoose.model<ISellerAuditLog>('SellerAuditLog', SellerAuditLogSchema);
