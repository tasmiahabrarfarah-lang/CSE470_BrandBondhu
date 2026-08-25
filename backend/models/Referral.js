import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refereeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
    },
    bonusCreditsAwarded: {
      referrerBonus: { type: Number, default: 15 },
      refereeBonus: { type: Number, default: 10 },
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

const Referral = mongoose.model('Referral', ReferralSchema);
export default Referral;
