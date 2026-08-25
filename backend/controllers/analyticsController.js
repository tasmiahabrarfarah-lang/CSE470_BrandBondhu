import Competitor from '../models/Competitor.js';
import SocialComment from '../models/SocialComment.js';
import User from '../models/User.js';

// FR-5: Sentiment Analysis
export const getSentimentAnalysis = async (req, res) => {
  try {
    const comments = await SocialComment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    // Calculate trends
    const total = comments.length;
    const positive = comments.filter(c => c.sentiment === 'positive').length;
    const negative = comments.filter(c => c.sentiment === 'negative').length;
    const neutral = comments.filter(c => c.sentiment === 'neutral').length;

    res.json({
      success: true,
      data: {
        comments,
        trends: { total, positive, negative, neutral }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const syncCommentsMock = async (req, res) => {
  try {
    // Mock fetching comments and analyzing them
    const newComments = [
      { userId: req.user._id, content: "Great product, loved it!", sentiment: 'positive' },
      { userId: req.user._id, content: "Delivery was very late and packaging was torn.", sentiment: 'negative', isFlagged: true, suggestedReply: "We are so sorry for the inconvenience! Please DM us your order number so we can make this right." },
      { userId: req.user._id, content: "How much is this?", sentiment: 'neutral' }
    ];
    await SocialComment.insertMany(newComments);
    res.json({ success: true, message: 'Comments synced and analyzed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// FR-6: Competitor Tracking
export const getCompetitors = async (req, res) => {
  try {
    const competitors = await Competitor.find({ userId: req.user._id });
    res.json({ success: true, data: competitors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCompetitor = async (req, res) => {
  try {
    const { pageUrl, name } = req.body;
    // Mock API fetching for metrics
    const metrics = {
      followers: Math.floor(Math.random() * 50000) + 1000,
      engagementRate: (Math.random() * 5 + 1).toFixed(2),
      postingFrequency: Math.floor(Math.random() * 10) + 1
    };
    
    const comp = await Competitor.create({
      userId: req.user._id,
      pageUrl,
      name,
      metrics
    });
    res.json({ success: true, data: comp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// FR-9: Analytics Dashboard
export const getDashboardStats = async (req, res) => {
  try {
    // Mock stats
    const stats = {
      followerGrowth: [
        { month: 'Jan', followers: 1200 },
        { month: 'Feb', followers: 1350 },
        { month: 'Mar', followers: 1600 },
        { month: 'Apr', followers: 1850 }
      ],
      avgEngagementRate: 4.2,
      contentGeneration: {
        captions: 15,
        posters: 8
      }
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
