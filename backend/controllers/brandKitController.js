import BrandKit from '../models/BrandKit.js';
import Subscription from '../models/Subscription.js';
import Notification from '../models/Notification.js';
import { logAuditAction } from '../utils/auditLogger.js';

// Color Palette generator preset engine based on user preference or industry
const GENERATE_COLOR_PALETTES = {
  'Modern & Vibrantly Colored': [
    { name: 'Primary Vibrant', hex: '#6366f1', type: 'primary' },
    { name: 'Secondary Electric', hex: '#8b5cf6', type: 'secondary' },
    { name: 'Accent Magenta', hex: '#d946ef', type: 'accent' },
    { name: 'Dark Surface', hex: '#0f172a', type: 'background' },
    { name: 'Light Text', hex: '#f8fafc', type: 'text' },
  ],
  'Warm & Traditional (Bangladeshi Vibe)': [
    { name: 'Crimson Red', hex: '#dc2626', type: 'primary' },
    { name: 'Warm Amber', hex: '#f59e0b', type: 'secondary' },
    { name: 'Emerald Green', hex: '#059669', type: 'accent' },
    { name: 'Deep Midnight', hex: '#1c1917', type: 'background' },
    { name: 'Soft Cream', hex: '#fef3c7', type: 'text' },
  ],
  'Cool Corporate & Professional': [
    { name: 'Ocean Navy', hex: '#0284c7', type: 'primary' },
    { name: 'Teal Focus', hex: '#0d9488', type: 'secondary' },
    { name: 'Cyan Highlight', hex: '#06b6d4', type: 'accent' },
    { name: 'Slate Background', hex: '#0f172a', type: 'background' },
    { name: 'Pure White', hex: '#ffffff', type: 'text' },
  ],
  'Minimalist & Elegant': [
    { name: 'Charcoal Black', hex: '#18181b', type: 'primary' },
    { name: 'Rose Gold Accent', hex: '#fb7185', type: 'secondary' },
    { name: 'Champagne Gold', hex: '#f59e0b', type: 'accent' },
    { name: 'Warm White', hex: '#fafafa', type: 'background' },
    { name: 'Off Black', hex: '#27272a', type: 'text' },
  ],
};

// Taglines Generator Helper based on Industry & Business Name
const GENERATE_TAGLINES = (name, industry) => {
  const cleanName = name || 'Brand';
  const cleanInd = industry || 'Business';
  return [
    {
      en: `${cleanName} - Crafting Quality for Your Everyday Needs`,
      bn: `${cleanName} - আপনার দৈনন্দিন প্রয়োজনে সেরা মানের নিশ্চয়তা`,
    },
    {
      en: `Trust, Value & Excellence with ${cleanName}`,
      bn: `${cleanName}-এর সাথে সততা, মান এবং আস্থার বন্ধন`,
    },
    {
      en: `Empowering Your Style & Success in ${cleanInd}`,
      bn: `${cleanInd} খাতে আপনার স্টাইল ও সাফল্যের সেরা সঙ্গী`,
    },
    {
      en: `${cleanName} - Innovation Rooted in Perfection`,
      bn: `${cleanName} - উদ্ভাবন ও নিখুঁত সেবার নাম`,
    },
  ];
};

// SVG Logo Generator Helper
const GENERATE_SVG_LOGO = (name, primaryColor = '#6366f1', accentColor = '#d946ef') => {
  const initial = (name || 'B').trim().charAt(0).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" />
        <stop offset="100%" stop-color="${accentColor}" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="200" height="200" rx="40" fill="url(#brandGrad)" />
    <circle cx="100" cy="100" r="65" fill="#ffffff" fill-opacity="0.15" />
    <text x="100" y="125" font-family="'Outfit', 'Inter', sans-serif" font-size="80" font-weight="900" fill="#ffffff" text-anchor="middle">${initial}</text>
  </svg>`;
};

// @desc    Generate AI Brand Kit (FR-2.1, FR-2.2, FR-2.3, FR-2.4)
// @route   POST /api/brand-kit/generate
// @access  Private (Seller/Collaborator)
export const generateBrandKit = async (req, res) => {
  try {
    const { businessName, industry, tone, targetAudience, colorPreference, versionName } = req.body;

    if (!businessName || !industry) {
      return res.status(400).json({ success: false, message: 'Business Name and Industry are required' });
    }

    // Deduct 1 Credit for generation
    const sub = await Subscription.findOne({ userId: req.businessId });
    if (sub && sub.credits.current < 1) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits remaining. Upgrade your subscription to generate brand kits.',
      });
    }

    if (sub) {
      sub.credits.current = Math.max(0, sub.credits.current - 1);
      await sub.save();
    }

    // Select or fallback palette
    const selectedPalette = GENERATE_COLOR_PALETTES[colorPreference] || GENERATE_COLOR_PALETTES['Modern & Vibrantly Colored'];
    const primaryHex = selectedPalette.find((c) => c.type === 'primary')?.hex || '#6366f1';
    const accentHex = selectedPalette.find((c) => c.type === 'accent')?.hex || '#d946ef';

    // SVG Logo
    const svgCode = GENERATE_SVG_LOGO(businessName, primaryHex, accentHex);

    // Taglines
    const taglines = GENERATE_TAGLINES(businessName, industry);

    // Typography preset
    const typography = {
      headingFont: 'Outfit, sans-serif',
      bodyFont: 'Inter, sans-serif',
      accentFont: 'Playfair Display, serif',
    };

    // Check existing kits for this business to determine versionName and active status
    const existingKitsCount = await BrandKit.countDocuments({ businessId: req.businessId });
    const isFirstKit = existingKitsCount === 0;

    const brandKit = await BrandKit.create({
      businessId: req.businessId,
      createdBy: req.user._id,
      versionName: versionName || `Version ${existingKitsCount + 1}`,
      isActive: isFirstKit,
      questionnaire: {
        businessName,
        industry,
        tone: tone || 'Professional & Friendly',
        targetAudience: targetAudience || 'General Consumers',
        colorPreference: colorPreference || 'Modern & Vibrantly Colored',
      },
      logo: {
        url: '',
        svgCode,
        iconName: 'sparkles',
        style: 'Modern Minimalist',
        primaryColor: primaryHex,
        accentColor: accentHex,
      },
      colorPalette: selectedPalette,
      typography,
      taglines,
    });

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'Generate AI Brand Kit',
      details: `Generated Brand Kit "${brandKit.versionName}" for ${businessName}`,
      targetResource: `BrandKit:${brandKit._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'AI Brand Kit generated successfully',
      data: brandKit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Brand Kits for a business (FR-2.6)
// @route   GET /api/brand-kit
// @access  Private (Seller/Collaborator/Admin)
export const getBrandKits = async (req, res) => {
  try {
    const brandKits = await BrandKit.find({ businessId: req.businessId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: brandKits.length, data: brandKits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current Active Brand Kit for a business (FR-2.6, FR-4.3)
// @route   GET /api/brand-kit/active
// @access  Private (Seller/Collaborator/Admin)
export const getActiveBrandKit = async (req, res) => {
  try {
    let activeKit = await BrandKit.findOne({ businessId: req.businessId, isActive: true });
    if (!activeKit) {
      // Fallback to most recent if none marked active
      activeKit = await BrandKit.findOne({ businessId: req.businessId }).sort({ createdAt: -1 });
    }

    res.status(200).json({ success: true, data: activeKit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set a Brand Kit version as Active (FR-2.6)
// @route   PUT /api/brand-kit/:id/set-active
// @access  Private (Seller/Collaborator)
export const setActiveBrandKit = async (req, res) => {
  try {
    const targetKit = await BrandKit.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!targetKit) {
      return res.status(404).json({ success: false, message: 'Brand Kit not found' });
    }

    // Reset active flag on all brand kits of this business
    await BrandKit.updateMany({ businessId: req.businessId }, { isActive: false });

    // Mark target as active
    targetKit.isActive = true;
    await targetKit.save();

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'Set Active Brand Kit',
      details: `Set "${targetKit.versionName}" as active brand kit`,
      targetResource: `BrandKit:${targetKit._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Set "${targetKit.versionName}" as active Brand Kit`,
      data: targetKit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update/Manually Adjust a Brand Kit asset (FR-2.5)
// @route   PUT /api/brand-kit/:id
// @access  Private (Seller/Collaborator)
export const updateBrandKit = async (req, res) => {
  try {
    const { versionName, logo, colorPalette, typography, taglines } = req.body;

    let brandKit = await BrandKit.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!brandKit) {
      return res.status(404).json({ success: false, message: 'Brand Kit version not found' });
    }

    if (versionName) brandKit.versionName = versionName;
    if (logo) {
      brandKit.logo = { ...brandKit.logo, ...logo };
      if (logo.primaryColor || logo.accentColor) {
        brandKit.logo.svgCode = GENERATE_SVG_LOGO(
          brandKit.questionnaire.businessName,
          brandKit.logo.primaryColor,
          brandKit.logo.accentColor
        );
      }
    }
    if (colorPalette) brandKit.colorPalette = colorPalette;
    if (typography) brandKit.typography = typography;
    if (taglines) brandKit.taglines = taglines;

    await brandKit.save();

    res.status(200).json({ success: true, message: 'Brand Kit updated successfully', data: brandKit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a Brand Kit version (FR-2.6)
// @route   DELETE /api/brand-kit/:id
// @access  Private (Seller/Collaborator)
export const deleteBrandKit = async (req, res) => {
  try {
    const brandKit = await BrandKit.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!brandKit) {
      return res.status(404).json({ success: false, message: 'Brand Kit not found' });
    }

    // If deleted kit was active, set the latest remaining kit as active
    if (brandKit.isActive) {
      const latestKit = await BrandKit.findOne({ businessId: req.businessId }).sort({ createdAt: -1 });
      if (latestKit) {
        latestKit.isActive = true;
        await latestKit.save();
      }
    }

    res.status(200).json({ success: true, message: 'Brand Kit version deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Regenerate specific asset (logo, colors, taglines) (FR-2.5)
// @route   POST /api/brand-kit/:id/regenerate-asset
// @access  Private (Seller/Collaborator)
export const regenerateAsset = async (req, res) => {
  try {
    const { assetType } = req.body; // 'logo', 'colors', 'taglines', 'typography'
    const brandKit = await BrandKit.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!brandKit) {
      return res.status(404).json({ success: false, message: 'Brand Kit not found' });
    }

    // Deduct 1 Credit
    const sub = await Subscription.findOne({ userId: req.businessId });
    if (sub && sub.credits.current < 1) {
      return res.status(400).json({ success: false, message: 'Insufficient credits remaining.' });
    }
    if (sub) {
      sub.credits.current = Math.max(0, sub.credits.current - 1);
      await sub.save();
    }

    if (assetType === 'logo') {
      const hue1 = Math.floor(Math.random() * 360);
      const hue2 = (hue1 + 120) % 360;
      const primaryHex = `hsl(${hue1}, 80%, 55%)`;
      const accentHex = `hsl(${hue2}, 85%, 60%)`;
      brandKit.logo.primaryColor = primaryHex;
      brandKit.logo.accentColor = accentHex;
      brandKit.logo.svgCode = GENERATE_SVG_LOGO(brandKit.questionnaire.businessName, primaryHex, accentHex);
    } else if (assetType === 'colors') {
      const keys = Object.keys(GENERATE_COLOR_PALETTES);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      brandKit.colorPalette = GENERATE_COLOR_PALETTES[randomKey];
    } else if (assetType === 'taglines') {
      brandKit.taglines = GENERATE_TAGLINES(brandKit.questionnaire.businessName, brandKit.questionnaire.industry);
    }

    await brandKit.save();

    res.status(200).json({
      success: true,
      message: `Regenerated ${assetType} successfully`,
      data: brandKit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
