import mongoose from 'mongoose';

const socialCommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    default: 'Facebook'
  },
  content: {
    type: String,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  suggestedReply: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('SocialComment', socialCommentSchema);
