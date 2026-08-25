import mongoose from 'mongoose';

const StyleGuideConfigSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brandKitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BrandKit',
      required: true,
    },
    title: {
      type: String,
      default: 'Official Brand Style Guide',
    },
    layoutPreset: {
      type: String,
      enum: ['Modern Grid', 'Classic Document', 'Compact Cards', 'Minimalist Slate'],
      default: 'Modern Grid',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'brand'],
      default: 'brand',
    },
    primaryAccent: {
      type: String,
      default: '#6366f1',
    },
    includedSections: {
      logoRules: { type: Boolean, default: true },
      colorPalette: { type: Boolean, default: true },
      typography: { type: Boolean, default: true },
      taglines: { type: Boolean, default: true },
      brandVoice: { type: Boolean, default: true },
      seoKeywords: { type: Boolean, default: true },
    },
    customRules: {
      logoDos: {
        type: [String],
        default: [
          'Maintain proportional clear space around the logo equivalent to the icon height.',
          'Use the full-color logo on white or dark backgrounds with sufficient contrast.',
          'Use monochromatic logo variations for high-contrast single-color prints.',
        ],
      },
      logoDonts: {
        type: [String],
        default: [
          'Do not stretch, distort, or alter the aspect ratio of the logo.',
          'Do not place the logo on busy pattern backgrounds without a clear container.',
          'Do not change the designated primary or accent logo colors.',
        ],
      },
      minLogoSize: {
        type: String,
        default: '32px width for digital displays, 15mm for print publications.',
      },
      clearSpace: {
        type: String,
        default: 'Minimum clear margin equal to 50% of logo icon height on all sides.',
      },
      fontUsageNotes: {
        type: String,
        default: 'Use Heading font for titles and marketing banners. Use Body font for descriptions and post text.',
      },
      toneGuidelines: {
        type: String,
        default: 'Polite, customer-centric, authentic, and appealing to Bangladeshi shoppers.',
      },
    },
    customNotes: {
      type: String,
      default: 'This document defines the visual identity guidelines for internal teams, collaborators, and marketing partners.',
    },
  },
  {
    timestamps: true,
  }
);

const StyleGuideConfig = mongoose.model('StyleGuideConfig', StyleGuideConfigSchema);
export default StyleGuideConfig;
