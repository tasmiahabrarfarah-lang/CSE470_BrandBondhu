import Subscription from '../models/Subscription.js';
import Notification from '../models/Notification.js';

// Available Tiers configuration details
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free Starter',
    price: 0,
    credits: 20,
    features: ['AI Caption Generator (Bangla/English)', 'Basic In-App Notifications'],
  },
  basic: {
    name: 'Basic Brand',
    price: 999, // BDT
    credits: 100,
    features: ['AI Caption & Tagline Generators', 'Full Brand Questionnaire', '1 Active Saved Brand Kit', 'bKash/Nagad Support'],
  },
  premium: {
    name: 'Premium Growth',
    price: 2499, // BDT
    credits: 300,
    features: ['Unlimited Taglines', 'Advanced Logo Regeneration', 'Auto-populated Brand Assets', '5 Saved Brand Kits', 'Priority In-app & Email Alerts', 'Collaborator Staff Access (up to 3)'],
  },
  enterprise: {
    name: 'Enterprise Scale',
    price: 4999, // BDT
    credits: 1000,
    features: ['Bulk CSV uploads', 'Full Multi-Platform scheduling', 'Unlimited Brand Kits', 'Dedicated Account Manager', 'Custom Escrow options', 'Unlimited Collaborator Staff invites'],
  },
};

// @desc    Get all subscription tiers
// @route   GET /api/subscriptions/plans
// @access  Public
export const getPlans = async (req, res) => {
  res.status(200).json({ success: true, data: SUBSCRIPTION_TIERS });
};

// @desc    Get user subscription and credit details
// @route   GET /api/subscriptions/my
// @access  Private
export const getMySubscription = async (req, res) => {
  try {
    // If collaborator, search under the parent Seller's business ID
    const searchId = req.businessId;

    let sub = await Subscription.findOne({ userId: searchId });
    if (!sub) {
      // Lazy initialize if missing
      sub = await Subscription.create({
        userId: searchId,
        tier: 'free',
        status: 'active',
        credits: { current: 20, total: 20 },
      });
    }

    res.status(200).json({ success: true, data: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Consume credit (Simulate AI content operation)
// @route   POST /api/subscriptions/consume
// @access  Private (Seller/Collaborator only)
export const consumeCredits = async (req, res) => {
  try {
    const searchId = req.businessId;
    const amount = parseInt(req.body.amount) || 1;

    const sub = await Subscription.findOne({ userId: searchId });
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscription record not found' });
    }

    if (sub.credits.current < amount) {
      // Trigger notification for low credit
      await Notification.create({
        userId: req.user.id,
        title: 'Credits Expired',
        message: 'Your branding credits have been exhausted. Please upgrade your subscription tier.',
        type: 'alert',
      });

      return res.status(400).json({
        success: false,
        message: 'Insufficient credits remaining. Please purchase a subscription upgrade.',
      });
    }

    // Deduct credits
    sub.credits.current = Math.max(0, sub.credits.current - amount);
    await sub.save();

    // Check low-credit threshold (20% or less remaining)
    const ratio = sub.credits.current / sub.credits.total;
    if (ratio <= 0.2 && sub.credits.current > 0) {
      // Create a warning notification if it hasn't been created recently
      const alreadyNotified = await Notification.findOne({
        userId: req.user.id,
        title: 'Low Credits Warning',
        isRead: false,
      });

      if (!alreadyNotified) {
        await Notification.create({
          userId: req.user.id,
          title: 'Low Credits Warning',
          message: `Your account has less than 20% of your credits remaining (${sub.credits.current}/${sub.credits.total}). Upgrade to avoid service interruptions.`,
          type: 'alert',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Credits deducted successfully',
      currentCredits: sub.credits.current,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
