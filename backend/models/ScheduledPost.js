import mongoose from 'mongoose';

const ScheduledPostSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Post title or short label is required'],
    },
    caption: {
      en: { type: String, default: '' },
      bn: { type: String, default: '' },
      activeText: { type: String, required: true },
    },
    hashtags: {
      type: [String],
      default: [],
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    tone: {
      type: String,
      default: 'Promotional',
    },
    platforms: {
      type: [String],
      default: ['Facebook'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Published', 'Failed'],
      default: 'Draft',
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ScheduledPost = mongoose.model('ScheduledPost', ScheduledPostSchema);
export default ScheduledPost;
