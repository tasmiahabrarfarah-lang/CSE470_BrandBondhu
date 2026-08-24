import User from '../models/User.js';
import DesignJob from '../models/DesignJob.js';
import Subscription from '../models/Subscription.js';
import SubscriptionTier from '../models/SubscriptionTier.js';
import Transaction from '../models/Transaction.js';
import BrandKit from '../models/BrandKit.js';
import ScheduledPost from '../models/ScheduledPost.js';

// @desc    Get all user accounts
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suspend a user account
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (Admin only)
export const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admins cannot be suspended' });
    }

    user.status = 'suspended';
    await user.save();

    res.status(200).json({ success: true, message: 'User account suspended successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unsuspend a user account
// @route   PUT /api/admin/users/:id/unsuspend
// @access  Private (Admin only)
export const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = 'active';
    await user.save();

    res.status(200).json({ success: true, message: 'User account unsuspended successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admins cannot be deleted' });
    }

    // Delete associated subscription
    await Subscription.findOneAndDelete({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.status(200).json({ success: true, message: 'User account permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all disputes in designer marketplace
// @route   GET /api/admin/disputes
// @access  Private (Admin only)
export const getDisputes = async (req, res) => {
  try {
    const disputes = await DesignJob.find({ status: 'Disputed' })
      .populate('sellerId', 'name email businessInfo')
      .populate('designerId', 'name email portfolioInfo')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: disputes.length, data: disputes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve designer marketplace dispute
// @route   PUT /api/admin/disputes/:id/resolve
// @access  Private (Admin only)
export const resolveDispute = async (req, res) => {
  try {
    const { resolution, resolveTo } = req.body; // resolveTo can be 'seller' or 'designer'
    
    if (!resolution) {
      return res.status(400).json({ success: false, message: 'Please provide a resolution explanation' });
    }

    if (!resolveTo || !['seller', 'designer'].includes(resolveTo)) {
      return res.status(400).json({ success: false, message: "Please specify resolveTo as 'seller' or 'designer'" });
    }

    const job = await DesignJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Design Job not found' });
    }

    if (job.status !== 'Disputed') {
      return res.status(400).json({ success: false, message: 'This job is not currently in a Disputed state' });
    }

    job.status = 'Closed';
    job.escrowStatus = resolveTo === 'seller' ? 'Refunded' : 'Released';
    
    job.disputeDetails = {
      ...job.disputeDetails,
      resolution,
      resolvedAt: new Date(),
    };

    await job.save();

    res.status(200).json({ success: true, message: 'Dispute resolved successfully', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform-wide analytics and revenue reports
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
export const getPlatformAnalytics = async (req, res) => {
  try {
    // 1. User stats
    const totalUsers = await User.countDocuments();
    const sellers = await User.countDocuments({ role: 'seller' });
    const designers = await User.countDocuments({ role: 'designer' });
    const collaborators = await User.countDocuments({ role: 'collaborator' });
    const suspended = await User.countDocuments({ status: 'suspended' });
    const active = await User.countDocuments({ status: 'active' });

    // 2. Revenue analytics
    const completedTransactions = await Transaction.find({ paymentStatus: 'completed' });
    const totalRevenue = completedTransactions.reduce((acc, t) => acc + t.amount, 0);

    // 3. Active Subscription Tier breakdown
    const subs = await Subscription.find();
    const tierCounts = { free: 0, basic: 0, premium: 0, enterprise: 0 };
    subs.forEach(s => {
      if (tierCounts[s.tier] !== undefined) {
        tierCounts[s.tier]++;
      }
    });

    // 4. Platform usage stats
    const totalBrandKits = await BrandKit.countDocuments();
    const totalScheduledPosts = await ScheduledPost.countDocuments();
    const totalPublishedPosts = await ScheduledPost.countDocuments({ status: 'Published' });
    const totalDesignJobs = await DesignJob.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          sellers,
          designers,
          collaborators,
          active,
          suspended
        },
        revenue: {
          totalRevenue,
          currency: 'BDT',
          transactionCount: completedTransactions.length
        },
        subscriptions: tierCounts,
        usage: {
          brandKits: totalBrandKits,
          scheduledPosts: totalScheduledPosts,
          publishedPosts: totalPublishedPosts,
          designJobs: totalDesignJobs
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a subscription tier pricing configurations
// @route   PUT /api/admin/pricing-tiers/:id
// @access  Private (Admin only)
export const updateSubscriptionTier = async (req, res) => {
  try {
    const { name, price, credits, features } = req.body;
    
    const tier = await SubscriptionTier.findById(req.params.id);
    if (!tier) {
      return res.status(404).json({ success: false, message: 'Subscription tier not found' });
    }

    if (name) tier.name = name;
    if (price !== undefined) tier.price = price;
    if (credits !== undefined) tier.credits = credits;
    if (features) tier.features = features;

    await tier.save();

    res.status(200).json({ success: true, message: 'Subscription tier updated successfully', data: tier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
