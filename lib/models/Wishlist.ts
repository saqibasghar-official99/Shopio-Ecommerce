import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  customer_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },

    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Prevent the same customer from adding
// the same product more than once.
WishlistSchema.index(
  {
    customer_id: 1,
    product_id: 1,
  },
  {
    unique: true,
  }
);

// Useful for finding all wishlists containing a product.
WishlistSchema.index({
  product_id: 1,
});

export default mongoose.models.Wishlist ||
  mongoose.model<IWishlist>(
    'Wishlist',
    WishlistSchema
  );