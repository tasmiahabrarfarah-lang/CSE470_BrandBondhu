import BannerTemplate from '../models/BannerTemplate.js';
import { logAuditAction } from '../utils/auditLogger.js';

// Pre-built Templates Dataset categorized by Industry / Occasion (FR-4.1)
const PREBUILT_TEMPLATES_DATA = [
  {
    title: 'Eid Mega Sale Promo',
    category: 'Festive & Eid',
    dimensions: { width: 1080, height: 1080 },
    backgroundColor: '#064e3b',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
    isPrebuilt: true,
    elements: [
      {
        id: 'badge-1',
        type: 'badge',
        content: '🌙 EID SPECIAL OFFER',
        x: 340,
        y: 80,
        width: 400,
        height: 50,
        color: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fontSize: 22,
        fontWeight: 'bold',
        brandField: 'none',
      },
      {
        id: 'title-1',
        type: 'text',
        content: 'ঈদ স্পেশাল ৫০% ছাড়!',
        x: 140,
        y: 180,
        width: 800,
        height: 100,
        color: '#fef3c7',
        fontSize: 64,
        fontWeight: '900',
        brandField: 'none',
      },
      {
        id: 'subtitle-1',
        type: 'text',
        content: 'আপনার প্রিয় পোশাক ও গিফট আইটেম পেয়ে যান সবচেয়ে সাশ্রয়ী মূল্যে!',
        x: 140,
        y: 300,
        width: 800,
        height: 60,
        color: '#cbd5e1',
        fontSize: 26,
        fontWeight: 'bold',
        brandField: 'none',
      },
      {
        id: 'brand-logo',
        type: 'logo',
        content: 'BRAND LOGO',
        x: 440,
        y: 400,
        width: 200,
        height: 120,
        color: '#ffffff',
        brandField: 'logo',
      },
      {
        id: 'brand-name',
        type: 'text',
        content: 'Business Name',
        x: 240,
        y: 540,
        width: 600,
        height: 60,
        color: '#34d399',
        fontSize: 32,
        fontWeight: 'bold',
        brandField: 'businessName',
      },
      {
        id: 'tagline-text',
        type: 'text',
        content: 'আপনার বিশ্বস্ত পছন্দের শপ',
        x: 240,
        y: 620,
        width: 600,
        height: 50,
        color: '#94a3b8',
        fontSize: 22,
        fontWeight: 'normal',
        brandField: 'tagline',
      },
      {
        id: 'cta-btn',
        type: 'badge',
        content: '🛒 এখনই ইনবক্স করুন',
        x: 340,
        y: 720,
        width: 400,
        height: 70,
        color: '#0f172a',
        backgroundColor: '#f59e0b',
        fontSize: 28,
        fontWeight: 'bold',
        brandField: 'none',
      },
    ],
  },
  {
    title: 'Flash Discount Deal',
    category: 'Discount & Sale',
    dimensions: { width: 1080, height: 1080 },
    backgroundColor: '#4c1d95',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
    isPrebuilt: true,
    elements: [
      {
        id: 'title-2',
        type: 'text',
        content: '⚡ FLASH SALE ⚡',
        x: 140,
        y: 120,
        width: 800,
        height: 90,
        color: '#fbbf24',
        fontSize: 72,
        fontWeight: '900',
        brandField: 'none',
      },
      {
        id: 'sub-2',
        type: 'text',
        content: 'সীমিত সময়ের জন্য সব প্রোডাক্টে ফ্ল্যাট ৩০% ক্যাশব্যাক!',
        x: 140,
        y: 230,
        width: 800,
        height: 60,
        color: '#ffffff',
        fontSize: 28,
        fontWeight: 'bold',
        brandField: 'none',
      },
      {
        id: 'brand-logo-2',
        type: 'logo',
        content: 'BRAND LOGO',
        x: 440,
        y: 350,
        width: 200,
        height: 120,
        color: '#ffffff',
        brandField: 'logo',
      },
      {
        id: 'brand-name-2',
        type: 'text',
        content: 'Your Business Name',
        x: 240,
        y: 500,
        width: 600,
        height: 60,
        color: '#c084fc',
        fontSize: 34,
        fontWeight: 'bold',
        brandField: 'businessName',
      },
      {
        id: 'cta-2',
        type: 'badge',
        content: 'ORDER NOW - LIMITED STOCK',
        x: 290,
        y: 620,
        width: 500,
        height: 70,
        color: '#ffffff',
        backgroundColor: '#d946ef',
        fontSize: 24,
        fontWeight: 'bold',
        brandField: 'none',
      },
    ],
  },
  {
    title: 'New Arrival Spotlight',
    category: 'New Arrival',
    dimensions: { width: 1080, height: 1080 },
    backgroundColor: '#0f172a',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    isPrebuilt: true,
    elements: [
      {
        id: 'badge-3',
        type: 'badge',
        content: '✨ NEW ARRIVALS',
        x: 340,
        y: 80,
        width: 400,
        height: 50,
        color: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fontSize: 22,
        fontWeight: 'bold',
        brandField: 'none',
      },
      {
        id: 'title-3',
        type: 'text',
        content: 'প্রিমিয়াম নিউ কালেকশন',
        x: 140,
        y: 160,
        width: 800,
        height: 90,
        color: '#ffffff',
        fontSize: 58,
        fontWeight: 'bold',
        brandField: 'none',
      },
      {
        id: 'brand-logo-3',
        type: 'logo',
        content: 'BRAND LOGO',
        x: 440,
        y: 300,
        width: 200,
        height: 120,
        color: '#ffffff',
        brandField: 'logo',
      },
      {
        id: 'brand-name-3',
        type: 'text',
        content: 'Your Business Name',
        x: 240,
        y: 450,
        width: 600,
        height: 60,
        color: '#38bdf8',
        fontSize: 32,
        fontWeight: 'bold',
        brandField: 'businessName',
      },
      {
        id: 'tagline-3',
        type: 'text',
        content: 'Modern & Authentic Style Solutions',
        x: 240,
        y: 530,
        width: 600,
        height: 50,
        color: '#94a3b8',
        fontSize: 22,
        brandField: 'tagline',
      },
      {
        id: 'cta-3',
        type: 'badge',
        content: '🛍️ Shop Collection Now',
        x: 340,
        y: 640,
        width: 400,
        height: 65,
        color: '#ffffff',
        backgroundColor: '#0284c7',
        fontSize: 24,
        fontWeight: 'bold',
        brandField: 'none',
      },
    ],
  },
];

// Seed prebuilt templates if database is empty
export const seedPrebuiltTemplates = async () => {
  try {
    const count = await BannerTemplate.countDocuments({ isPrebuilt: true });
    if (count === 0) {
      await BannerTemplate.insertMany(PREBUILT_TEMPLATES_DATA);
      console.log('Seeded prebuilt poster/banner templates for BrandBondhu.');
    }
  } catch (err) {
    console.error('Failed to seed prebuilt templates:', err.message);
  }
};

// @desc    Get templates (pre-built system templates + user custom templates) (FR-4.1)
// @route   GET /api/templates
// @access  Private (Seller/Collaborator)
export const getTemplates = async (req, res) => {
  try {
    const { category } = req.query;

    const query = {
      $or: [{ isPrebuilt: true }, { businessId: req.businessId }],
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    const templates = await BannerTemplate.find(query).sort({ isPrebuilt: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single template by ID
// @route   GET /api/templates/:id
// @access  Private (Seller/Collaborator)
export const getTemplateById = async (req, res) => {
  try {
    const template = await BannerTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save custom template for reuse (FR-4.5)
// @route   POST /api/templates
// @access  Private (Seller/Collaborator)
export const createCustomTemplate = async (req, res) => {
  try {
    const { title, category, dimensions, backgroundColor, gradient, elements, thumbnail } = req.body;

    if (!title || !elements || !Array.isArray(elements)) {
      return res.status(400).json({ success: false, message: 'Title and visual elements array are required' });
    }

    const template = await BannerTemplate.create({
      title,
      category: category || 'Custom',
      dimensions: dimensions || { width: 1080, height: 1080 },
      backgroundColor: backgroundColor || '#0f172a',
      gradient: gradient || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      isPrebuilt: false,
      businessId: req.businessId,
      createdBy: req.user._id,
      elements,
      thumbnail: thumbnail || '',
    });

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'Save Custom Banner Template',
      details: `Saved custom template "${title}" in category "${template.category}"`,
      targetResource: `BannerTemplate:${template._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Custom template saved successfully',
      data: template,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update custom template (FR-4.5)
// @route   PUT /api/templates/:id
// @access  Private (Seller/Collaborator)
export const updateCustomTemplate = async (req, res) => {
  try {
    let template = await BannerTemplate.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Custom template not found or unauthorized' });
    }

    const { title, category, dimensions, backgroundColor, gradient, elements, thumbnail } = req.body;

    if (title) template.title = title;
    if (category) template.category = category;
    if (dimensions) template.dimensions = dimensions;
    if (backgroundColor) template.backgroundColor = backgroundColor;
    if (gradient) template.gradient = gradient;
    if (elements) template.elements = elements;
    if (thumbnail !== undefined) template.thumbnail = thumbnail;

    await template.save();

    res.status(200).json({ success: true, message: 'Template updated successfully', data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete custom template (FR-4.5)
// @route   DELETE /api/templates/:id
// @access  Private (Seller/Collaborator)
export const deleteCustomTemplate = async (req, res) => {
  try {
    const template = await BannerTemplate.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Custom template not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Custom template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
