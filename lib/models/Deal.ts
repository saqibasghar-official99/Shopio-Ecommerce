import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeal extends Document {
  name: string;
  subtitle: string;
  image: string;
  href: string;
  badge?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    href: {
      type: String,
      default: "/products",
      trim: true,
    },

    badge: {
      type: String,
      default: "",
      trim: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    sort_order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const Deal: Model<IDeal> =
  mongoose.models.Deal ||
  mongoose.model<IDeal>("Deal", DealSchema);

export default Deal;