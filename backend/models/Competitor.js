import mongoose from 'mongoose';

const competitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pageUrl: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  metrics: {
    followers: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    postingFrequency: { type: Number, default: 0 }, // posts per week
  }
}, { timestamps: true });

export default mongoose.model('Competitor', competitorSchema);
