import mongoose from 'mongoose';

const HashtagTemplateSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Please add a template title'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    hashtags: [
      {
        tag: { type: String, required: true },
        reach: { type: String, enum: ['High', 'Medium', 'Niche'], default: 'Medium' },
        popularityScore: { type: Number, default: 75 },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const HashtagTemplate = mongoose.model('HashtagTemplate', HashtagTemplateSchema);
export default HashtagTemplate;
