import mongoose from 'mongoose';

const TicketResponseSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  senderRole: {
    type: String,
    enum: ['admin', 'seller', 'designer', 'collaborator', 'guest'],
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachments: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SupportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestInfo: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Technical Issue', 'Billing & Subscriptions', 'Marketplace & Escrow', 'Account & Security', 'General Inquiry'],
      default: 'General Inquiry',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'],
      default: 'Open',
    },
    description: {
      type: String,
      required: [true, 'Please describe the issue'],
    },
    attachments: {
      type: [String],
      default: [],
    },
    responses: [TicketResponseSchema],
    rating: {
      stars: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: '' },
      ratedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);
export default SupportTicket;
