import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryZone extends Document {
  name: string;
  cities: string[];
  fee: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const DeliveryZoneSchema = new Schema<IDeliveryZone>({
  name: { type: String, required: true, trim: true },
  cities: { type: [String], default: [] },
  fee: { type: Number, required: true, min: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.models.DeliveryZone || mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);
