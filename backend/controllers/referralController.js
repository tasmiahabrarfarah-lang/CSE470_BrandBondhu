import Referral from '../models/Referral.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

// Helper to generate alphanumeric unique referral code
export const generateUniqueReferralCode = async (userName) => {
  const prefix = 'REF';
  const cleanName = (userName || 'USER').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}-${cleanName}${randomHex}`;
    const existingUser = await User.findOne({ referralCode: code });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return code;
};

// @desc    Get user's referral code, link, stats, and history (FR-20.1, FR-20.3)
// @route   GET /api/referrals/my
// @access  Private
export const getMyReferrals = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId);

    // If user does not have a referral code yet, generate one
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode(user.name);
      await user.save();
    }

    // Fetch referral history where user is the referrer
    const referrals = await Referral.find({ referrerId: userId })
      .populate('refereeId', 'name email createdAt status')
      .sort({ createdAt: -1 });

    const totalReferrals = referrals.length;
    const totalBonusEarned = referrals.reduce(
      (sum, ref) => sum + (ref.bonusCreditsAwarded?.referrerBonus || 15),
      0
    );

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const referralLink = `${baseUrl}/register?ref=${user.referralCode}`;

    res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        stats: {
          totalReferrals,
          totalBonusEarned,
          referrerBonusAmount: 15,
          refereeBonusAmount: 10,
        },
        history: referrals.map((ref) => ({
          id: ref._id,
          refereeName: ref.refereeId ? ref.refereeId.name : 'Registered User',
          refereeEmail: ref.refereeId ? ref.refereeId.email : '',
          joinedAt: ref.createdAt,
          status: ref.status,
          bonusEarned: ref.bonusCreditsAwarded?.referrerBonus || 15,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate referral code during registration (FR-20.1)
// @route   GET /api/referrals/validate/:code
// @access  Public
export const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }

    const referrer = await User.findOne({ referralCode: code.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    res.status(200).json({
      success: true,
      message: `Valid referral code from ${referrer.name}`,
      data: {
        referrerName: referrer.name,
        referralCode: referrer.referralCode,
        bonusCredits: 10,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform-wide referral metrics (Admin)
// @route   GET /api/referrals/admin/stats
// @access  Private (Admin)
export const getReferralStats = async (req, res) => {
  try {
    const totalReferrals = await Referral.countDocuments();
    const allReferrals = await Referral.find();
    
    const totalCreditsIssued = allReferrals.reduce(
      (sum, r) => sum + (r.bonusCreditsAwarded?.referrerBonus || 15) + (r.bonusCreditsAwarded?.refereeBonus || 10),
      0
    );

    // Top Referrers
    const topReferrers = await Referral.aggregate([
      { $group: { _id: '$referrerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalReferrals,
        totalCreditsIssued,
        topReferrers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
