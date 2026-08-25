import FAQ from '../models/FAQ.js';
import SocialComment from '../models/SocialComment.js';
import { replyToFacebookComment } from '../utils/facebookGraphAPI.js';

// @desc    Get all FAQs for the business
// @route   GET /api/faq
// @access  Private (Seller)
export const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ businessId: req.businessId || req.user._id });
    res.status(200).json({ success: true, count: faqs.length, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new FAQ
// @route   POST /api/faq
// @access  Private (Seller)
export const createFAQ = async (req, res) => {
  try {
    const { question, answer, keywords, isActive } = req.body;
    
    const faq = await FAQ.create({
      businessId: req.businessId || req.user._id,
      question,
      answer,
      keywords: keywords || [],
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an FAQ
// @route   PUT /api/faq/:id
// @access  Private (Seller)
export const updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId || req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an FAQ
// @route   DELETE /api/faq/:id
// @access  Private (Seller)
export const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findOneAndDelete({ _id: req.params.id, businessId: req.businessId || req.user._id });
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    res.status(200).json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process an incoming comment to see if it matches any FAQ
export const processCommentForFAQ = async (businessId, commentContent, commentId, fbToken) => {
  try {
    const faqs = await FAQ.find({ businessId, isActive: true });
    
    const lowerContent = commentContent.toLowerCase();
    
    for (let faq of faqs) {
      const isMatch = faq.keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
      
      if (isMatch) {
        console.log(`FAQ matched! Replying to comment ${commentId} with: ${faq.answer}`);
        
        if (fbToken && fbToken !== 'mock_token' && commentId) {
          const result = await replyToFacebookComment(fbToken, commentId, faq.answer);
          if (!result.success) {
            console.error('Failed to reply to comment via API:', result.error);
          }
        }
        
        return faq.answer;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error processing comment for FAQ:', error);
    return null;
  }
};
