import ScheduledPost from '../models/ScheduledPost.js';
import Product from '../models/Product.js';
import Subscription from '../models/Subscription.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/email.js';
import { logAuditAction } from '../utils/auditLogger.js';

// AI Caption Generator Logic Engine with Tone Selection & Bangla/English output
const CAPTION_GENERATOR = ({ productName, description, tone, category, price }) => {
  const pName = productName || 'আমাদের সেরা পণ্য';
  const desc = description || 'উচ্চমানের মানসম্মত আকর্ষণীয় পণ্য।';
  const pr = price ? `মাত্র ৳${price}` : 'আকর্ষণীয় অফারে';

  let en = '';
  let bn = '';
  let hashtags = ['#BrandBondhu', '#OnlineShoppingBD', '#BangladeshSellers', '#FashionBD'];

  if (category) {
    hashtags.push(`#${category.replace(/\s+/g, '')}`);
  }

  if (tone === 'Promotional') {
    bn = `🔥 মেগা ডিসকাউন্ট অফার! 🔥\n\n${pName} এখন পাবেন ${pr}! ${desc}\n\nস্টক সীমিত! আপনার অর্ডারটি নিশ্চিত করতে এখনই ইনবক্স করুন বা কমেন্ট করুন। 🛍️✨`;
    en = `🔥 Special Promo Alert! 🔥\n\nGet your hands on ${pName} for ${pr}! ${desc}\n\nLimited stock available. Inbox us or drop a comment now to place your order! 🛍️✨`;
    hashtags.push('#DiscountOfferBD', '#SpecialOffer', '#ShopNow');
  } else if (tone === 'Casual') {
    bn = `হাই সবাইকে! 👋\n\nদেখুন আমাদের নতুন ${pName}! ${desc}\n\nকেমন লাগলো জানাবেন কিন্তু! অর্ডার করতে মেসেজ দিন 💌`;
    en = `Hey everyone! 👋\n\nCheck out our latest ${pName}! ${desc}\n\nLet us know what you think! Drop us a DM to grab yours today 💌`;
    hashtags.push('#TrendingBD', '#DailyEssentials', '#NewIn');
  } else if (tone === 'Urgent') {
    bn = `⏰ শেষ সুযোগ! সময় দ্রুত ফুরিয়ে যাচ্ছে! ⏰\n\n${pName} - ${desc}\nমূল্য: ${pr}\n\nআর মাত্র কয়েক ঘণ্টার জন্য এই অফারটি প্রযোজ্য! এখনই অর্ডার করুন! 🚀`;
    en = `⏰ Last Chance Alert! Time is running out! ⏰\n\n${pName} - ${desc}\nPrice: ${pr}\n\nOffer valid for a few hours only! Order now before it's gone! 🚀`;
    hashtags.push('#FlashSale', '#LimitedStock', '#HurryUp');
  } else if (tone === 'Storytelling') {
    bn = `একটি ছোট গল্পের মতো সুন্দর অনুভূতি নিয়ে এসেছে ${pName}। ${desc}\n\nপ্রতিটি ব্যবহারের সাথেই অনুভব করবেন সততা আর প্রিমিয়াম কোয়ালিটি। ${pr} মূল্যেই আপনার ঘরে পৌঁছে যাবে! ❤️`;
    en = `Experience elegance and charm with ${pName}. ${desc}\n\nCrafted with love and utmost attention to detail. Bring home happiness today at ${pr}! ❤️`;
    hashtags.push('#BrandStory', '#QualityFirst', '#CustomerLove');
  } else {
    // Formal / Default
    bn = `সম্মানিত গ্রাহকবৃন্দ,\n\nআমরা অত্যন্ত আনন্দের সাথে পেশ করছি ${pName}। ${desc}\nমূল্য: ${pr}। বিস্তারিত জানতে এবং অর্ডার করতে যোগাযোগ করুন। ধন্যবাদ।`;
    en = `Dear Valued Customers,\n\nWe are pleased to present ${pName}. ${desc}\nPrice: ${pr}. Contact us for details and order placement. Thank you.`;
    hashtags.push('#PremiumQuality', '#OfficialLaunch', '#BDCommerce');
  }

  return { bn, en, hashtags };
};

// @desc    Generate AI Product Captions (FR-3.1, FR-3.2, FR-13.4)
// @route   POST /api/content/generate-caption
// @access  Private (Seller/Collaborator)
export const generateCaption = async (req, res) => {
  try {
    const { productId, productName, description, tone, category, price } = req.body;

    let targetProductName = productName;
    let targetDesc = description;
    let targetCategory = category;
    let targetPrice = price;

    // Auto-pull from Product Catalog if productId provided (FR-13.4)
    if (productId) {
      const prod = await Product.findOne({ _id: productId, businessId: req.businessId });
      if (prod) {
        targetProductName = prod.name;
        targetDesc = prod.description;
        targetCategory = prod.category;
        targetPrice = prod.price;
      }
    }

    if (!targetDesc && !targetProductName) {
      return res.status(400).json({ success: false, message: 'Please provide a product description or select a product' });
    }

    // Deduct 1 Credit
    const sub = await Subscription.findOne({ userId: req.businessId });
    if (sub && sub.credits.current < 1) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits remaining. Please upgrade your plan to generate captions.',
      });
    }

    if (sub) {
      sub.credits.current = Math.max(0, sub.credits.current - 1);
      await sub.save();
    }

    const { bn, en, hashtags } = CAPTION_GENERATOR({
      productName: targetProductName,
      description: targetDesc,
      tone: tone || 'Promotional',
      category: targetCategory,
      price: targetPrice,
    });

    res.status(200).json({
      success: true,
      message: 'AI Caption generated successfully',
      data: {
        bn,
        en,
        activeText: `${bn}\n\n${en}\n\n${hashtags.join(' ')}`,
        hashtags,
        tone: tone || 'Promotional',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create/Schedule a Content Post (FR-3.3, FR-3.5)
// @route   POST /api/content/posts
// @access  Private (Seller/Collaborator)
export const createPost = async (req, res) => {
  try {
    const { productId, title, caption, hashtags, mediaUrl, tone, platforms, status, scheduledAt } = req.body;

    if (!title || !caption || !caption.activeText) {
      return res.status(400).json({ success: false, message: 'Post title and caption text are required' });
    }

    const postStatus = status || (scheduledAt ? 'Scheduled' : 'Draft');

    const post = await ScheduledPost.create({
      businessId: req.businessId,
      createdBy: req.user._id,
      productId: productId || null,
      title,
      caption,
      hashtags: hashtags || [],
      mediaUrl: mediaUrl || '',
      tone: tone || 'Promotional',
      platforms: platforms || ['Facebook'],
      status: postStatus,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    });

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'Create Scheduled Content Post',
      details: `Created post "${title}" with status "${postStatus}"`,
      targetResource: `ScheduledPost:${post._id}`,
    });

    res.status(201).json({ success: true, message: 'Post saved successfully', data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Content Posts for calendar or list view (FR-3.3, FR-3.6)
// @route   GET /api/content/posts
// @access  Private (Seller/Collaborator)
export const getPosts = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const filter = { businessId: req.businessId };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.scheduledAt = {};
      if (startDate) filter.scheduledAt.$gte = new Date(startDate);
      if (endDate) filter.scheduledAt.$lte = new Date(endDate);
    }

    const posts = await ScheduledPost.find(filter)
      .populate('productId', 'name price images')
      .sort({ scheduledAt: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single post details
// @route   GET /api/content/posts/:id
// @access  Private (Seller/Collaborator)
export const getPostById = async (req, res) => {
  try {
    const post = await ScheduledPost.findOne({ _id: req.params.id, businessId: req.businessId }).populate('productId');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Scheduled post not found' });
    }
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit scheduled content entry (FR-3.5)
// @route   PUT /api/content/posts/:id
// @access  Private (Seller/Collaborator)
export const updatePost = async (req, res) => {
  try {
    const { title, caption, hashtags, mediaUrl, tone, platforms, status, scheduledAt } = req.body;

    let post = await ScheduledPost.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Scheduled post not found' });
    }

    if (title) post.title = title;
    if (caption) post.caption = caption;
    if (hashtags) post.hashtags = hashtags;
    if (mediaUrl !== undefined) post.mediaUrl = mediaUrl;
    if (tone) post.tone = tone;
    if (platforms) post.platforms = platforms;
    if (status) post.status = status;
    if (scheduledAt !== undefined) {
      post.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      if (post.scheduledAt && post.status === 'Draft') {
        post.status = 'Scheduled';
      }
    }

    await post.save();

    res.status(200).json({ success: true, message: 'Post updated successfully', data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete scheduled post entry (FR-3.5)
// @route   DELETE /api/content/posts/:id
// @access  Private (Seller/Collaborator)
export const deletePost = async (req, res) => {
  try {
    const post = await ScheduledPost.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Scheduled post not found' });
    }

    res.status(200).json({ success: true, message: 'Scheduled post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger reminder & auto-publishing processor for due scheduled posts (FR-3.4)
// @route   POST /api/content/posts/trigger-reminders
// @access  Private (Seller/Collaborator/Admin)
export const triggerPostReminders = async (req, res) => {
  try {
    const now = new Date();
    // Due or upcoming within 15 mins
    const upcomingLimit = new Date(now.getTime() + 15 * 60 * 1000);

    const duePosts = await ScheduledPost.find({
      status: 'Scheduled',
      scheduledAt: { $lte: upcomingLimit },
    }).populate('createdBy businessId');

    let processedCount = 0;

    for (const post of duePosts) {
      // Create In-App Notification (FR-3.4, FR-11.1)
      await Notification.create({
        userId: post.businessId._id || post.createdBy._id,
        title: 'Post Schedule Reminder',
        message: `Your scheduled post "${post.title}" is due for publishing on ${post.platforms.join(', ')}.`,
        type: 'reminder',
      });

      // Send Email Reminder (FR-3.4)
      if (post.createdBy && post.createdBy.email) {
        await sendEmail({
          email: post.createdBy.email,
          subject: `Reminder: Scheduled Post "${post.title}" is Due!`,
          message: `Hello ${post.createdBy.name},\n\nThis is a reminder that your scheduled post "${post.title}" is due to be published.\n\nCaption:\n${post.caption.activeText}\n\nPlatforms: ${post.platforms.join(', ')}`,
        });
      }

      post.reminderSent = true;
      if (post.scheduledAt <= now) {
        post.status = 'Published';
        post.publishedAt = now;
      }
      await post.save();
      processedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Processed reminders and publishing status for ${processedCount} scheduled posts`,
      processedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
