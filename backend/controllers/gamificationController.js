import User from '../models/User.js';
import BrandKit from '../models/BrandKit.js';
import ScheduledPost from '../models/ScheduledPost.js';
import SocialComment from '../models/SocialComment.js';
import Notification from '../models/Notification.js';

// Helper to check and award badges
const awardBadgeIfEarned = async (user, badgeName, badgeDescription) => {
  const hasBadge = user.badges.some(b => b.name === badgeName);
  if (!hasBadge) {
    user.badges.push({ name: badgeName, description: badgeDescription, awardedAt: new Date() });
    
    // Create in-app notification
    await Notification.create({
      userId: user._id,
      title: '🏆 New Badge Earned!',
      message: `Congratulations! You have been awarded the "${badgeName}" badge: ${badgeDescription}`,
      type: 'alert',
    });
    
    return true;
  }
  return false;
};

// @desc    Recalculate and fetch gamification profile (score, badges, streak)
// @route   GET /api/gamification/profile
// @access  Private (Seller/Collaborator only)
export const getGamificationProfile = async (req, res) => {
  try {
    const businessId = req.businessId; // Resolution for collaborators
    const user = await User.findById(businessId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User business account not found' });
    }

    // --- 1. Brand Kit Completeness Calculation (Max 30 points) ---
    let brandKitPoints = 0;
    const activeKit = await BrandKit.findOne({ businessId, isActive: true });
    
    let isKitComplete = false;
    if (activeKit) {
      // Questionnaire completed (+10)
      if (activeKit.questionnaire && activeKit.questionnaire.businessName && activeKit.questionnaire.industry) {
        brandKitPoints += 10;
      }
      // Logo URL or SVG code exists (+10)
      if ((activeKit.logo && activeKit.logo.url) || (activeKit.logo && activeKit.logo.svgCode)) {
        brandKitPoints += 10;
      }
      // Color palette exists (+5)
      if (activeKit.colorPalette && activeKit.colorPalette.length > 0) {
        brandKitPoints += 5;
      }
      // Typography suggested (+5)
      if (activeKit.typography && (activeKit.typography.headingFont || activeKit.typography.bodyFont)) {
        brandKitPoints += 5;
      }

      isKitComplete = brandKitPoints === 30;
    }

    // --- 2. Posting Consistency Calculation (Max 40 points) ---
    // Fetch all published posts
    const publishedPosts = await ScheduledPost.find({ businessId, status: 'Published' }).sort({ publishedAt: 1 });
    
    // Total posts component (Max 20 pts: 5 pts per post)
    const postCountPoints = Math.min(20, publishedPosts.length * 5);

    // Calculate streak logic (Max 20 pts: 3 pts per streak day)
    let currentStreak = 0;
    if (publishedPosts.length > 0) {
      // Extract unique dates of publication in local YYYY-MM-DD
      const uniqueDates = Array.from(
        new Set(
          publishedPosts
            .filter(p => p.publishedAt)
            .map(p => new Date(p.publishedAt).toISOString().split('T')[0])
        )
      ).sort((a, b) => new Date(b) - new Date(a)); // Descending order (newest first)

      if (uniqueDates.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Streak must be active either today or yesterday
        const hasPostedRecently = uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr;

        if (hasPostedRecently) {
          currentStreak = 1;
          for (let i = 0; i < uniqueDates.length - 1; i++) {
            const current = new Date(uniqueDates[i]);
            const next = new Date(uniqueDates[i + 1]);
            const diffTime = Math.abs(current - next);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              currentStreak++;
            } else {
              break; // Streak broken
            }
          }
        }
      }
    }

    const streakPoints = Math.min(20, currentStreak * 3);
    const postingPoints = postCountPoints + streakPoints;

    // --- 3. Engagement Score Calculation (Max 30 points) ---
    const comments = await SocialComment.find({ userId: businessId });
    const positiveCount = comments.filter(c => c.sentiment === 'positive').length;
    const neutralCount = comments.filter(c => c.sentiment === 'neutral').length;
    
    const engagementScore = (positiveCount * 5) + (neutralCount * 2);
    const engagementPoints = Math.min(30, engagementScore);

    // --- Total Branding Score (Cap at 100) ---
    const totalScore = Math.min(100, brandKitPoints + postingPoints + engagementPoints);

    // Save update to User model
    user.brandingScore = totalScore;
    user.streakDays = currentStreak;
    if (publishedPosts.length > 0) {
      user.lastPostDate = publishedPosts[publishedPosts.length - 1].publishedAt;
    }
    
    // Award badges check
    let badgeAwarded = false;
    
    // Badge 1: Brand Complete
    if (isKitComplete) {
      const awarded = await awardBadgeIfEarned(user, 'Brand Complete', 'Your brand identity questionnaire, logo, and palette are fully configured.');
      if (awarded) badgeAwarded = true;
    }

    // Badge 2: 7-Day Streak
    if (currentStreak >= 7) {
      const awarded = await awardBadgeIfEarned(user, '7-Day Streak', 'You successfully published posts on 7 consecutive days.');
      if (awarded) badgeAwarded = true;
    }

    // Badge 3: Consistent Creator
    if (publishedPosts.length >= 10) {
      const awarded = await awardBadgeIfEarned(user, 'Consistent Creator', 'You published 10 or more social media posts.');
      if (awarded) badgeAwarded = true;
    }

    // Badge 4: Engagement Guru
    if (positiveCount >= 5) {
      const awarded = await awardBadgeIfEarned(user, 'Engagement Guru', 'You received 5 or more positive comments from customers.');
      if (awarded) badgeAwarded = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        brandingScore: user.brandingScore,
        streakDays: user.streakDays,
        optInLeaderboard: user.optInLeaderboard,
        badges: user.badges,
        lastPostDate: user.lastPostDate,
        breakdown: {
          brandKitPoints,
          postingPoints,
          engagementPoints,
          details: {
            isKitComplete,
            publishedCount: publishedPosts.length,
            positiveCount,
            neutralCount
          }
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle opt-in status for similar-industry leaderboards
// @route   PUT /api/gamification/leaderboard/toggle
// @access  Private (Seller/Collaborator only)
export const toggleLeaderboardOptIn = async (req, res) => {
  try {
    const { optIn } = req.body;
    if (optIn === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide optIn status' });
    }

    const businessId = req.businessId;
    const user = await User.findById(businessId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User business account not found' });
    }

    user.optInLeaderboard = !!optIn;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully ${user.optInLeaderboard ? 'opted into' : 'opted out of'} leaderboard.`,
      optInLeaderboard: user.optInLeaderboard
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leaderboard rankings for users in similar industries
// @route   GET /api/gamification/leaderboard
// @access  Private (Seller/Collaborator/Admin only)
export const getLeaderboard = async (req, res) => {
  try {
    const businessId = req.businessId;
    const user = await User.findById(businessId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User business account not found' });
    }

    if (!user.optInLeaderboard) {
      return res.status(400).json({
        success: false,
        message: 'You must opt into the leaderboard to view rankings.',
        optInLeaderboard: false
      });
    }

    const industry = user.businessInfo?.industry || 'Retail';

    // Find other sellers who have opted in and belong to the same industry
    const leaders = await User.find({
      role: 'seller',
      optInLeaderboard: true,
      'businessInfo.industry': industry,
      status: 'active'
    })
      .select('name businessInfo brandingScore streakDays profilePicture')
      .sort({ brandingScore: -1, streakDays: -1 });

    res.status(200).json({
      success: true,
      industry,
      data: leaders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
