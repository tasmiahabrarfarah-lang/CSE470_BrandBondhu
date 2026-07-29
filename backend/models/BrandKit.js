import mongoose from 'mongoose';

const BrandKitSchema = new mongoose.Schema(
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
    versionName: {
      type: String,
      required: true,
      default: 'Version 1',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    questionnaire: {
      businessName: { type: String, required: true },
      industry: { type: String, required: true },
      tone: { type: String, default: 'Professional & Friendly' },
      targetAudience: { type: String, default: 'General Consumers' },
      colorPreference: { type: String, default: 'Modern & Vibrantly Colored' },
    },
    logo: {
      url: { type: String, default: '' },
      svgCode: { type: String, default: '' },
      iconName: { type: String, default: 'sparkles' },
      style: { type: String, default: 'Modern Minimalist' },
      primaryColor: { type: String, default: '#6366f1' },
      accentColor: { type: String, default: '#d946ef' },
    },
    colorPalette: [
      {
        name: { type: String, default: 'Primary' },
        hex: { type: String, required: true },
        type: { type: String, enum: ['primary', 'secondary', 'accent', 'background', 'text'], default: 'primary' },
      },
    ],
    typography: {
      headingFont: { type: String, default: 'Outfit, sans-serif' },
      bodyFont: { type: String, default: 'Inter, sans-serif' },
      accentFont: { type: String, default: 'Playfair Display, serif' },
    },
    taglines: [
      {
        en: { type: String, required: true },
        bn: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const BrandKit = mongoose.model('BrandKit', BrandKitSchema);
export default BrandKit;
