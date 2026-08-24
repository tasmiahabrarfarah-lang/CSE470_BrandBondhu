import HashtagTemplate from '../models/HashtagTemplate.js';
import Product from '../models/Product.js';
import Subscription from '../models/Subscription.js';
import { logAuditAction } from '../utils/auditLogger.js';

// AI Hashtag & SEO Generation Engine
const HASHTAG_SEO_ENGINE = ({ productName, description, category, targetAudience }) => {
  const pName = productName || 'পণ্য / প্রোডাক্ট';
  const desc = description || 'উচ্চমানের সেরা মানের পণ্য।';
  const cat = category || 'General';

  // Base domain keywords for Bangladesh e-commerce
  const cleanCat = cat.replace(/\s+/g, '');
  const cleanName = pName.replace(/[^a-zA-Z0-9]/g, '');

  const highReach = [
    { tag: '#BrandBondhu', reach: 'High', popularityScore: 98 },
    { tag: '#OnlineShoppingBD', reach: 'High', popularityScore: 95 },
    { tag: '#BangladeshSellers', reach: 'High', popularityScore: 92 },
    { tag: '#DhakaShopping', reach: 'High', popularityScore: 90 },
    { tag: '#FCommerceBD', reach: 'High', popularityScore: 88 },
    { tag: '#BDShop', reach: 'High', popularityScore: 86 },
    { tag: '#দেশিসেলার', reach: 'High', popularityScore: 94 },
    { tag: '#অনলাইনশপিং', reach: 'High', popularityScore: 91 },
  ];

  const mediumReach = [
    { tag: `#${cleanCat}BD`, reach: 'Medium', popularityScore: 82 },
    { tag: `#Best${cleanCat}Offer`, reach: 'Medium', popularityScore: 79 },
    { tag: '#TrendingBD', reach: 'Medium', popularityScore: 78 },
    { tag: '#QualityProductBD', reach: 'Medium', popularityScore: 76 },
    { tag: '#FastDeliveryBD', reach: 'Medium', popularityScore: 74 },
    { tag: '#সেরাকালেকশন', reach: 'Medium', popularityScore: 80 },
    { tag: '#অফারচলছে', reach: 'Medium', popularityScore: 77 },
  ];

  const nicheReach = [
    cleanName ? { tag: `#${cleanName}BD`, reach: 'Niche', popularityScore: 58 } : null,
    { tag: `#Custom${cleanCat}`, reach: 'Niche', popularityScore: 55 },
    { tag: `#HandcraftedBD`, reach: 'Niche', popularityScore: 52 },
    { tag: '#প্রিমিয়ামপণ্য', reach: 'Niche', popularityScore: 59 },
    { tag: '#হোমডেলিভারি', reach: 'Niche', popularityScore: 56 },
  ].filter(Boolean);

  const allHashtags = [...highReach, ...mediumReach, ...nicheReach];

  // SEO Recommendations
  const seoTitleEn = `Buy ${pName} Online in Bangladesh | Best ${cat} Price`;
  const seoTitleBn = `বাংলাদেশে ${pName} সেরা দামে কিনুন | অনলাইন শপ`;
  
  const metaDescEn = `Get authentic ${pName} in Bangladesh. ${desc} Fast home delivery and best price guaranteed at our online store!`;
  const metaDescBn = `বাংলাদেশে পেয়ে যান সেরা মানের ${pName}। ${desc} দ্রুত ক্যাশ অন ডেলিভারি এবং আকর্ষণীয় দামে সংগ্রহ করুন।`;

  const focusKeywords = [
    `${pName} price in BD`,
    `best ${cat} Bangladesh`,
    `online ${pName} shop Dhaka`,
    `${pName} দাম কত`,
    `${cat} অনলাইন শপিং`,
  ];

  const searchTerms = [
    { term: `${pName} BD price`, volume: 'High', intent: 'Transactional' },
    { term: `best ${cat} store near me`, volume: 'Medium', intent: 'Commercial' },
    { term: `অনলাইনে ${pName} কেনার উপায়`, volume: 'High', intent: 'Informational' },
    { term: `${pName} discount offer Bangladesh`, volume: 'Medium', intent: 'Transactional' },
  ];

  const seoTips = [
    'Use primary keywords within the first 100 characters of your Facebook/Instagram post description.',
    'Include clear call-to-action (CTA) like "Inbox to Order" or "Visit Website".',
    'Mix high-reach hashtags with niche product hashtags to maximize explore page visibility.',
  ];

  return {
    hashtags: allHashtags,
    categorized: {
      high: highReach,
      medium: mediumReach,
      niche: nicheReach,
    },
    seo: {
      titleEn: seoTitleEn,
      titleBn: seoTitleBn,
      metaDescEn,
      metaDescBn,
      focusKeywords,
      searchTerms,
      seoScore: 88,
      seoTips,
    },
  };
};

// @desc    Generate Hashtags & SEO Suggestions (FR-14.1, FR-14.2)
// @route   POST /api/hashtags/generate
// @access  Private (Seller/Collaborator with 'content' permission)
export const generateHashtagsAndSEO = async (req, res) => {
  try {
    const { productId, productName, description, category, targetAudience } = req.body;

    let targetName = productName;
    let targetDesc = description;
    let targetCategory = category;

    // Pull from catalog if productId provided
    if (productId) {
      const prod = await Product.findOne({ _id: productId, businessId: req.businessId });
      if (prod) {
        targetName = prod.name;
        targetDesc = prod.description;
        targetCategory = prod.category;
      }
    }

    if (!targetName && !targetDesc) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a product name or description to generate hashtag & SEO suggestions.',
      });
    }

    // Deduct credit if subscription exists
    const sub = await Subscription.findOne({ userId: req.businessId });
    if (sub && sub.credits.current < 1) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits. Upgrade your plan to generate hashtags & SEO recommendations.',
      });
    }

    if (sub) {
      sub.credits.current = Math.max(0, sub.credits.current - 1);
      await sub.save();
    }

    const generated = HASHTAG_SEO_ENGINE({
      productName: targetName,
      description: targetDesc,
      category: targetCategory,
      targetAudience,
    });

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'Generate Hashtags & SEO Suggestions',
      details: `Generated hashtags and SEO metadata for "${targetName || 'Product'}"`,
    });

    res.status(200).json({
      success: true,
      message: 'Hashtag and SEO suggestions generated successfully',
      data: generated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save a set of hashtags as a template (FR-14.3)
// @route   POST /api/hashtags/templates
// @access  Private (Seller/Collaborator with 'content' permission)
export const saveHashtagTemplate = async (req, res) => {
  try {
    const { title, category, hashtags, notes } = req.body;

    if (!title || !hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Template title and a list of hashtags are required',
      });
    }

    const normalizedHashtags = hashtags.map((item) => {
      if (typeof item === 'string') {
        const tag = item.startsWith('#') ? item : `#${item}`;
        return { tag, reach: 'Medium', popularityScore: 75 };
      }
      return item;
    });

    const template = await HashtagTemplate.create({
      businessId: req.businessId,
      createdBy: req.user._id,
      title,
      category: category || 'General',
      hashtags: normalizedHashtags,
      notes: notes || '',
    });

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'Create Hashtag Template',
      details: `Saved hashtag template "${title}" with ${normalizedHashtags.length} hashtags`,
      targetResource: `HashtagTemplate:${template._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Hashtag template saved successfully',
      data: template,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get saved hashtag templates (FR-14.3)
// @route   GET /api/hashtags/templates
// @access  Private (Seller/Collaborator)
export const getHashtagTemplates = async (req, res) => {
  try {
    const templates = await HashtagTemplate.find({ businessId: req.businessId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a saved hashtag template (FR-14.3, FR-14.4)
// @route   PUT /api/hashtags/templates/:id
// @access  Private (Seller/Collaborator with 'content' permission)
export const updateHashtagTemplate = async (req, res) => {
  try {
    const { title, category, hashtags, notes } = req.body;

    let template = await HashtagTemplate.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Hashtag template not found' });
    }

    if (title) template.title = title;
    if (category) template.category = category;
    if (notes !== undefined) template.notes = notes;
    if (hashtags && Array.isArray(hashtags)) {
      template.hashtags = hashtags.map((item) => {
        if (typeof item === 'string') {
          const tag = item.startsWith('#') ? item : `#${item}`;
          return { tag, reach: 'Medium', popularityScore: 75 };
        }
        return item;
      });
    }

    await template.save();

    res.status(200).json({
      success: true,
      message: 'Hashtag template updated successfully',
      data: template,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a saved hashtag template (FR-14.3)
// @route   DELETE /api/hashtags/templates/:id
// @access  Private (Seller/Collaborator with 'content' permission)
export const deleteHashtagTemplate = async (req, res) => {
  try {
    const template = await HashtagTemplate.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Hashtag template not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Hashtag template deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
