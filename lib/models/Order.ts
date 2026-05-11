import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
  comparePrice: number;
  qty: number;
}

export interface IOrder extends Document {
  order_number: string;
  customer_id: mongoose.Types.ObjectId | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  is_guest: boolean;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  delivery_zone: string;
  coupon_code: string;
  notes: string;
  invoice_url: string;
  created_at: Date;
  updated_at: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, default: '' },
  image: { type: String, default: '' },
  unitPrice: { type: Number, required: true },
  comparePrice: { type: Number, default: 0 },
  qty: { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  order_number: { type: String, required: true, unique: true },
  customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, required: true },
  customer_email: { type: String, default: '' },
  customer_address: { type: String, default: '' },
  customer_city: { type: String, default: '' },
  is_guest: { type: Boolean, default: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  delivery_fee: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  payment_method: { type: String, default: 'cod' },
  payment_status: { type: String, default: 'pending', enum: ['pending', 'paid', 'failed', 'refunded'] },
  order_status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] },
  delivery_zone: { type: String, default: '' },
  coupon_code: { type: String, default: '' },
  notes: { type: String, default: '' },
  invoice_url: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// order_number unique index is declared on the field definition above.
OrderSchema.index({ customer_id: 1, created_at: -1 });
OrderSchema.index({ order_status: 1, created_at: -1 });
OrderSchema.index({ payment_status: 1, created_at: -1 });
OrderSchema.index({ created_at: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
