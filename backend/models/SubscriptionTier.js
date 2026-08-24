import mongoose from 'mongoose';

const SubscriptionTierSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      required: true,
      unique: true,
      enum: ['free', 'basic', 'premium', 'enterprise'],
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const SubscriptionTier = mongoose.model('SubscriptionTier', SubscriptionTierSchema);
export default SubscriptionTier;
