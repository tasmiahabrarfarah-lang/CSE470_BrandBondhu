import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const DeliverableSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    notes: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  }
);

const ReviewSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  }
);

const DesignJobSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    designerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a job title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a job description'],
    },
    category: {
      type: String,
      required: [true, 'Please select a design category'],
      default: 'Logo Design',
    },
    budget: {
      type: Number,
      required: [true, 'Please add a budget amount'],
      min: [0, 'Budget must be non-negative'],
    },
    deadline: {
      type: Date,
      default: null,
    },
    referenceImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Requested', 'Accepted', 'In Progress', 'Submitted', 'Approved', 'Revision Requested', 'Disputed', 'Closed'],
      default: 'Requested',
    },
    escrowStatus: {
      type: String,
      enum: ['Pending', 'Held', 'Released', 'Refunded'],
      default: 'Held', // Held upon seller placing request
    },
    deliverableFiles: {
      type: [DeliverableSchema],
      default: [],
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    sellerReview: {
      type: ReviewSchema,
      default: null,
    },
    designerReview: {
      type: ReviewSchema,
      default: null,
    },
    disputeDetails: {
      raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String, default: '' },
      resolution: { type: String, default: '' },
      resolvedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

const DesignJob = mongoose.model('DesignJob', DesignJobSchema);
export default DesignJob;
