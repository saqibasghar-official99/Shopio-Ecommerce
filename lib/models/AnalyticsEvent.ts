import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  product_id: mongoose.Types.ObjectId;
  event_type: 'visit' | 'click';
  session_id: string | null;
  created_at: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    event_type: {
      type: String,
      enum: ['visit', 'click'],
      required: true,
      index: true,
    },

    session_id: {
      type: String,
      default: null,
      index: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

// Useful for analytics queries by product + event + date
AnalyticsEventSchema.index({
  product_id: 1,
  event_type: 1,
  created_at: -1,
});

const AnalyticsEvent: Model<IAnalyticsEvent> =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEvent>(
    'AnalyticsEvent',
    AnalyticsEventSchema
  );

export default AnalyticsEvent;