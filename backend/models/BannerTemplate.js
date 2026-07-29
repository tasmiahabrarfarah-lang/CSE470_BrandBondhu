import mongoose from 'mongoose';

const CanvasElementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'shape', 'logo', 'badge'], required: true },
    content: { type: String, default: '' },
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 60 },
    rotation: { type: Number, default: 0 },
    color: { type: String, default: '#ffffff' },
    backgroundColor: { type: String, default: 'transparent' },
    fontSize: { type: Number, default: 24 },
    fontWeight: { type: String, default: 'bold' },
    fontFamily: { type: String, default: 'Inter, sans-serif' },
    textAlign: { type: String, default: 'center' },
    borderRadius: { type: Number, default: 0 },
    opacity: { type: Number, default: 1 },
    brandField: { 
      type: String, 
      enum: ['none', 'logo', 'businessName', 'primaryColor', 'secondaryColor', 'accentColor', 'tagline', 'productImage'],
      default: 'none' 
    },
  },
  { _id: false }
);

const BannerTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Template title is required'],
    },
    category: {
      type: String,
      required: true,
      default: 'Promotional',
    },
    dimensions: {
      width: { type: Number, default: 1080 },
      height: { type: Number, default: 1080 },
    },
    backgroundColor: {
      type: String,
      default: '#0f172a',
    },
    gradient: {
      type: String,
      default: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    },
    isPrebuilt: {
      type: Boolean,
      default: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    elements: [CanvasElementSchema],
    thumbnail: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const BannerTemplate = mongoose.model('BannerTemplate', BannerTemplateSchema);
export default BannerTemplate;
