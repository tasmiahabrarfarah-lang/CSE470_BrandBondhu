import BrandKit from '../models/BrandKit.js';
import StyleGuideConfig from '../models/StyleGuideConfig.js';
import User from '../models/User.js';
import { logAuditAction } from '../utils/auditLogger.js';

// Helper to convert hex to rgb string
const hexToRgb = (hex) => {
  if (!hex) return 'rgb(0, 0, 0)';
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return `rgb(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`;
};

// @desc    Get complete Brand Style Guide data & layout config (FR-15.1, FR-15.2)
// @route   GET /api/style-guide / GET /api/style-guide/:brandKitId
// @access  Private (Seller/Collaborator with 'brand_kit' permission)
export const getStyleGuide = async (req, res) => {
  try {
    const { brandKitId } = req.params;

    let brandKit;
    if (brandKitId) {
      brandKit = await BrandKit.findOne({ _id: brandKitId, businessId: req.businessId });
    } else {
      // Get active brand kit or latest created
      brandKit = await BrandKit.findOne({ businessId: req.businessId, isActive: true });
      if (!brandKit) {
        brandKit = await BrandKit.findOne({ businessId: req.businessId }).sort({ createdAt: -1 });
      }
    }

    if (!brandKit) {
      return res.status(404).json({
        success: false,
        message: 'No Brand Kit found. Please create an AI Brand Identity first.',
      });
    }

    let config = await StyleGuideConfig.findOne({ brandKitId: brandKit._id, businessId: req.businessId });
    if (!config) {
      config = await StyleGuideConfig.create({
        businessId: req.businessId,
        brandKitId: brandKit._id,
        title: `${brandKit.questionnaire.businessName} - Brand Style Guide`,
        primaryAccent: brandKit.logo?.primaryColor || '#6366f1',
      });
    }

    const businessUser = await User.findById(req.businessId).select('name businessInfo email phone');

    // Enrich palette with RGB values
    const enrichedPalette = (brandKit.colorPalette || []).map(item => ({
      name: item.name,
      hex: item.hex,
      rgb: hexToRgb(item.hex),
      type: item.type,
    }));

    const styleGuidePayload = {
      brandKit: {
        _id: brandKit._id,
        versionName: brandKit.versionName,
        isActive: brandKit.isActive,
        questionnaire: brandKit.questionnaire,
        logo: brandKit.logo,
        colorPalette: enrichedPalette,
        typography: brandKit.typography,
        taglines: brandKit.taglines,
        updatedAt: brandKit.updatedAt,
      },
      config,
      businessInfo: {
        businessName: brandKit.questionnaire?.businessName || businessUser?.businessInfo?.businessName || 'BrandBondhu Business',
        industry: brandKit.questionnaire?.industry || businessUser?.businessInfo?.industry || 'eCommerce',
        email: businessUser?.email || '',
        phone: businessUser?.phone || '',
        website: businessUser?.businessInfo?.website || '',
        fbPageUrl: businessUser?.businessInfo?.fbPageUrl || '',
      },
    };

    res.status(200).json({
      success: true,
      message: 'Brand Style Guide payload retrieved successfully',
      data: styleGuidePayload,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Brand Style Guide Layout Customization (FR-15.2)
// @route   PUT /api/style-guide/:brandKitId
// @access  Private (Seller/Collaborator with 'brand_kit' permission)
export const updateStyleGuideConfig = async (req, res) => {
  try {
    const { brandKitId } = req.params;
    const { title, layoutPreset, theme, primaryAccent, includedSections, customRules, customNotes } = req.body;

    const brandKit = await BrandKit.findOne({ _id: brandKitId, businessId: req.businessId });
    if (!brandKit) {
      return res.status(404).json({ success: false, message: 'Brand Kit not found' });
    }

    let config = await StyleGuideConfig.findOne({ brandKitId: brandKit._id, businessId: req.businessId });

    if (!config) {
      config = new StyleGuideConfig({
        businessId: req.businessId,
        brandKitId: brandKit._id,
      });
    }

    if (title) config.title = title;
    if (layoutPreset) config.layoutPreset = layoutPreset;
    if (theme) config.theme = theme;
    if (primaryAccent) config.primaryAccent = primaryAccent;
    if (includedSections) config.includedSections = { ...config.includedSections, ...includedSections };
    if (customRules) config.customRules = { ...config.customRules, ...customRules };
    if (customNotes !== undefined) config.customNotes = customNotes;

    await config.save();

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'Update Brand Style Guide Layout',
      details: `Updated style guide layout to "${config.layoutPreset}" with theme "${config.theme}"`,
      targetResource: `StyleGuideConfig:${config._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Brand Style Guide layout configuration updated successfully',
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export Style Guide Payload for PDF Document Rendering (FR-15.3)
// @route   GET /api/style-guide/:brandKitId/export
// @access  Private (Seller/Collaborator with 'brand_kit' permission)
export const exportStyleGuidePDF = async (req, res) => {
  try {
    const { brandKitId } = req.params;

    const brandKit = await BrandKit.findOne({ _id: brandKitId, businessId: req.businessId });
    if (!brandKit) {
      return res.status(404).json({ success: false, message: 'Brand Kit not found' });
    }

    let config = await StyleGuideConfig.findOne({ brandKitId: brandKit._id, businessId: req.businessId });
    if (!config) {
      config = await StyleGuideConfig.create({
        businessId: req.businessId,
        brandKitId: brandKit._id,
        title: `${brandKit.questionnaire.businessName} - Official Style Guide`,
      });
    }

    const businessUser = await User.findById(req.businessId).select('name businessInfo email phone');

    const exportDocument = {
      documentId: `SG-${brandKit._id.toString().substring(18).toUpperCase()}-${Date.now()}`,
      exportedAt: new Date(),
      title: config.title || `${brandKit.questionnaire.businessName} Brand Guidelines`,
      versionName: brandKit.versionName,
      layoutPreset: config.layoutPreset,
      theme: config.theme,
      businessInfo: {
        businessName: brandKit.questionnaire?.businessName || businessUser?.businessInfo?.businessName || 'Business Owner',
        industry: brandKit.questionnaire?.industry || 'eCommerce',
        email: businessUser?.email,
        phone: businessUser?.phone,
      },
      brandingAssets: {
        logo: brandKit.logo,
        palette: (brandKit.colorPalette || []).map(c => ({ ...c.toObject(), rgb: hexToRgb(c.hex) })),
        typography: brandKit.typography,
        taglines: brandKit.taglines,
        questionnaire: brandKit.questionnaire,
      },
      rulesAndGuidelines: config.customRules,
      customNotes: config.customNotes,
      sectionsIncluded: config.includedSections,
    };

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'Export Brand Style Guide PDF',
      details: `Generated PDF export for Brand Kit "${brandKit.versionName}"`,
      targetResource: `BrandKit:${brandKit._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Brand Style Guide PDF export data ready',
      data: exportDocument,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
