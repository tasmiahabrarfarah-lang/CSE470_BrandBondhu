import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    tier: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'expiring', 'expired', 'cancelled'],
      default: 'active',
    },
    credits: {
      current: { type: Number, default: 20 }, // Free tier starts with 20 credits
      total: { type: Number, default: 20 },
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export default Subscription;
