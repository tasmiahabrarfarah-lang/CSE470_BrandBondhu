import DesignJob from '../models/DesignJob.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logAuditAction } from '../utils/auditLogger.js';

// @desc    Browse / Search Designers (FR-7.2, FR-7.1)
// @route   GET /api/marketplace/designers
// @access  Public / Read-only for Guest, Seller, Collaborator
export const getDesigners = async (req, res) => {
  try {
    const { search, skill, maxRate } = req.query;

    const query = { role: 'designer', status: 'active' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'portfolioInfo.bio': { $regex: search, $options: 'i' } },
        { 'portfolioInfo.skills': { $regex: search, $options: 'i' } },
      ];
    }

    if (skill && skill !== 'All') {
      query['portfolioInfo.skills'] = { $regex: skill, $options: 'i' };
    }

    if (maxRate) {
      query['portfolioInfo.hourlyRate'] = { $lte: Number(maxRate) };
    }

    const designers = await User.find(query).select('-password');

    // Aggregate rating stats per designer
    const designersWithStats = await Promise.all(
      designers.map(async (d) => {
        const jobs = await DesignJob.find({
          designerId: d._id,
          'sellerReview.rating': { $exists: true },
        });

        const totalReviews = jobs.length;
        const avgRating = totalReviews > 0
          ? (jobs.reduce((acc, j) => acc + j.sellerReview.rating, 0) / totalReviews).toFixed(1)
          : '5.0';

        return {
          _id: d._id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          profilePicture: d.profilePicture,
          portfolioInfo: d.portfolioInfo || { bio: '', skills: [], hourlyRate: 0, portfolioLinks: [] },
          rating: Number(avgRating),
          reviewCount: totalReviews,
        };
      })
    );

    res.status(200).json({ success: true, count: designersWithStats.length, data: designersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get designer profile details
// @route   GET /api/marketplace/designers/:id
// @access  Public / Private
export const getDesignerProfile = async (req, res) => {
  try {
    const designer = await User.findOne({ _id: req.params.id, role: 'designer' }).select('-password');
    if (!designer) {
      return res.status(404).json({ success: false, message: 'Designer profile not found' });
    }

    // Get completed jobs and reviews
    const completedJobs = await DesignJob.find({
      designerId: designer._id,
      status: 'Approved',
    }).populate('sellerId', 'name profilePicture businessInfo');

    res.status(200).json({
      success: true,
      data: {
        ...designer.toObject(),
        completedJobsCount: completedJobs.length,
        recentReviews: completedJobs
          .filter((j) => j.sellerReview)
          .map((j) => ({
            jobTitle: j.title,
            rating: j.sellerReview.rating,
            comment: j.sellerReview.comment,
            createdAt: j.sellerReview.createdAt,
            sellerName: j.sellerId?.businessInfo?.businessName || j.sellerId?.name || 'Seller',
          })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request a custom design job (FR-7.3, FR-7.7)
// @route   POST /api/marketplace/jobs
// @access  Private (Seller/Collaborator with 'marketplace' permission)
export const requestJob = async (req, res) => {
  try {
    const { designerId, title, description, category, budget, deadline, referenceImages } = req.body;

    if (!designerId || !title || !description || !budget) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const designer = await User.findById(designerId);
    if (!designer || designer.role !== 'designer') {
      return res.status(404).json({ success: false, message: 'Selected designer not found' });
    }

    const job = await DesignJob.create({
      sellerId: req.businessId,
      designerId,
      requestedBy: req.user._id,
      title,
      description,
      category: category || 'Logo Design',
      budget: Number(budget),
      deadline: deadline ? new Date(deadline) : null,
      referenceImages: referenceImages || [],
      status: 'Requested',
      escrowStatus: 'Held', // Held in escrow until seller approval (FR-7.7)
      messages: [
        {
          sender: req.user._id,
          senderName: req.user.name,
          senderRole: req.user.role,
          text: `Job Request Created: "${title}" with budget ৳${budget}. Initial notes: ${description}`,
          createdAt: new Date(),
        },
      ],
    });

    // Notify designer
    await Notification.create({
      userId: designer._id,
      title: '🎨 New Design Job Request!',
      message: `${req.user.name} requested a design job "${title}" (Budget: ৳${budget}).`,
      type: 'system',
    });

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'REQUEST_DESIGN_JOB',
      details: `Requested design job "${title}" from designer ${designer.name} (Budget: ৳${budget})`,
      targetResource: `DesignJob:${job._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Design job request created successfully and payment held in escrow!',
      data: job,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get design jobs list
// @route   GET /api/marketplace/jobs
// @access  Private (Seller/Collaborator/Designer/Admin)
export const getJobs = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      // Admin gets all jobs or disputed jobs
      const { status } = req.query;
      if (status) query.status = status;
    } else if (req.user.role === 'designer') {
      query.designerId = req.user._id;
    } else {
      // Seller / Collaborator
      query.sellerId = req.businessId;
    }

    const jobs = await DesignJob.find(query)
      .populate('sellerId', 'name email businessInfo profilePicture')
      .populate('designerId', 'name email portfolioInfo profilePicture')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single job details
// @route   GET /api/marketplace/jobs/:id
// @access  Private
export const getJobById = async (req, res) => {
  try {
    const job = await DesignJob.findById(req.params.id)
      .populate('sellerId', 'name email businessInfo profilePicture')
      .populate('designerId', 'name email portfolioInfo profilePicture');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Verify access
    const isSellerSide = job.sellerId._id.toString() === req.businessId.toString();
    const isDesignerSide = job.designerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSellerSide && !isDesignerSide && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this job' });
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Designer accepts job request
// @route   PUT /api/marketplace/jobs/:id/accept
// @access  Private (Designer only)
export const acceptJob = async (req, res) => {
  try {
    const job = await DesignJob.findOne({ _id: req.params.id, designerId: req.user._id });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found or not assigned to you' });
    }

    job.status = 'In Progress';
    job.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: 'Accepted job request! I am now working on your design deliverables.',
    });

    await job.save();

    // Notify seller
    await Notification.create({
      userId: job.sellerId,
      title: '✅ Design Job Accepted',
      message: `${req.user.name} accepted your job request "${job.title}".`,
      type: 'system',
    });

    res.status(200).json({ success: true, message: 'Job accepted!', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Designer submits deliverable files (FR-7.5)
// @route   PUT /api/marketplace/jobs/:id/deliver
// @access  Private (Designer only)
export const submitDeliverables = async (req, res) => {
  try {
    const { fileName, fileUrl, notes } = req.body;

    if (!fileName || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Please provide deliverable file name and URL' });
    }

    const job = await DesignJob.findOne({ _id: req.params.id, designerId: req.user._id });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found or not assigned to you' });
    }

    job.deliverableFiles.push({ fileName, fileUrl, notes: notes || '', uploadedAt: new Date() });
    job.status = 'Submitted';
    job.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: `Submitted final deliverables: ${fileName}. ${notes ? `Note: ${notes}` : ''}`,
      attachments: [fileUrl],
    });

    await job.save();

    await Notification.create({
      userId: job.sellerId,
      title: '📁 Design Deliverables Submitted!',
      message: `${req.user.name} uploaded deliverable files for "${job.title}". Please review and approve.`,
      type: 'system',
    });

    res.status(200).json({ success: true, message: 'Deliverables submitted for approval', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seller approves deliverables & releases escrow payment (FR-7.7)
// @route   PUT /api/marketplace/jobs/:id/approve
// @access  Private (Seller/Collaborator with 'marketplace' permission)
export const approveDeliverables = async (req, res) => {
  try {
    const job = await DesignJob.findOne({ _id: req.params.id, sellerId: req.businessId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.status = 'Approved';
    job.escrowStatus = 'Released'; // Release held escrow funds (FR-7.7)
    job.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: `Approved final deliverables! Escrow funds (৳${job.budget}) released to designer.`,
    });

    await job.save();

    await Notification.create({
      userId: job.designerId,
      title: '🎉 Deliverables Approved & Payment Released!',
      message: `Your deliverables for "${job.title}" were approved. ৳${job.budget} released from escrow!`,
      type: 'system',
    });

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'APPROVE_DESIGN_DELIVERABLES',
      details: `Approved deliverables & released ৳${job.budget} escrow for job "${job.title}"`,
      targetResource: `DesignJob:${job._id}`,
    });

    res.status(200).json({ success: true, message: 'Deliverables approved and escrow released!', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seller requests revision
// @route   PUT /api/marketplace/jobs/:id/revision
// @access  Private (Seller/Collaborator with 'marketplace' permission)
export const requestRevision = async (req, res) => {
  try {
    const { revisionNotes } = req.body;
    const job = await DesignJob.findOne({ _id: req.params.id, sellerId: req.businessId });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.status = 'In Progress'; // Move back to in progress
    job.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: `Revision requested: ${revisionNotes || 'Please adjust the deliverables according to feedback.'}`,
    });

    await job.save();

    await Notification.create({
      userId: job.designerId,
      title: '🔄 Revision Requested',
      message: `Revision requested for "${job.title}": ${revisionNotes || 'Check message thread'}`,
      type: 'system',
    });

    res.status(200).json({ success: true, message: 'Revision feedback sent to designer', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Post message in job chat thread (FR-7.4)
// @route   POST /api/marketplace/jobs/:id/messages
// @access  Private (Seller/Collaborator/Designer)
export const postMessage = async (req, res) => {
  try {
    const { text, attachments } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const job = await DesignJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Verify participant
    const isSeller = job.sellerId.toString() === req.businessId.toString();
    const isDesigner = job.designerId.toString() === req.user._id.toString();

    if (!isSeller && !isDesigner) {
      return res.status(403).json({ success: false, message: 'Not authorized to participate in this job thread' });
    }

    job.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text,
      attachments: attachments || [],
    });

    await job.save();

    // Notify recipient
    const recipientId = isSeller ? job.designerId : job.sellerId;
    await Notification.create({
      userId: recipientId,
      title: `💬 New Message on "${job.title}"`,
      message: `${req.user.name}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
      type: 'message',
    });

    res.status(201).json({ success: true, data: job.messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Two-way rating & review system after completion (FR-7.6)
// @route   POST /api/marketplace/jobs/:id/review
// @access  Private (Seller/Collaborator or Designer)
export const submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const job = await DesignJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const isSeller = job.sellerId.toString() === req.businessId.toString();
    const isDesigner = job.designerId.toString() === req.user._id.toString();

    if (isSeller) {
      job.sellerReview = { rating: Number(rating), comment: comment || '', createdAt: new Date() };
    } else if (isDesigner) {
      job.designerReview = { rating: Number(rating), comment: comment || '', createdAt: new Date() };
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized to review this job' });
    }

    // Close job if both reviews submitted or approved
    if (job.status === 'Approved') {
      job.status = 'Closed';
    }

    await job.save();

    res.status(200).json({ success: true, message: 'Review submitted successfully', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Raise a dispute for admin moderation (FR-7.7, FR-12.2)
// @route   PUT /api/marketplace/jobs/:id/dispute
// @access  Private (Seller/Collaborator or Designer)
export const raiseDispute = async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await DesignJob.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.status = 'Disputed';
    job.disputeDetails = {
      raisedBy: req.user._id,
      reason: reason || 'Dispute raised regarding work deliverables/escrow.',
      resolution: '',
      resolvedAt: null,
    };
    job.messages.push({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: `⚠️ DISPUTE RAISED: ${reason || 'Job placed in dispute for Admin resolution.'}`,
    });

    await job.save();

    res.status(200).json({ success: true, message: 'Job placed in dispute. Admin will review.', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin resolves dispute (FR-12.2)
// @route   PUT /api/marketplace/jobs/:id/resolve-dispute
// @access  Private (Admin only)
export const resolveDispute = async (req, res) => {
  try {
    const { resolution, action } = req.body; // action: 'release' or 'refund'
    const job = await DesignJob.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.status = 'Closed';
    if (action === 'refund') {
      job.escrowStatus = 'Refunded';
    } else {
      job.escrowStatus = 'Released';
    }

    job.disputeDetails.resolution = resolution || `Dispute resolved by Admin (${action}).`;
    job.disputeDetails.resolvedAt = new Date();

    job.messages.push({
      sender: req.user._id,
      senderName: 'System Admin',
      senderRole: 'admin',
      text: `⚖️ ADMIN DISPUTE RESOLUTION (${action.toUpperCase()}): ${job.disputeDetails.resolution}`,
    });

    await job.save();

    res.status(200).json({ success: true, message: 'Dispute resolved by Admin', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
