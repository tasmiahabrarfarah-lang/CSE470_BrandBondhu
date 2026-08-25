import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { logAuditAction } from '../utils/auditLogger.js';

// @desc    Update user profile details
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, profilePicture, businessInfo, portfolioInfo } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // Save business profile details (Seller / Collaborators)
    if (user.role === 'seller' || user.role === 'collaborator') {
      if (businessInfo) {
        user.businessInfo = {
          ...user.businessInfo,
          ...businessInfo,
        };
      }
    }

    // Save designer portfolio details
    if (user.role === 'designer') {
      if (portfolioInfo) {
        user.portfolioInfo = {
          ...user.portfolioInfo,
          ...portfolioInfo,
        };
      }
    }

    const updatedUser = await user.save();

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'UPDATE_PROFILE',
      details: `Updated user profile details`,
      targetResource: `User:${user._id}`,
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite/Create a collaborator (Staff) (FR-17.1, FR-17.2)
// @route   POST /api/profile/collaborators
// @access  Private (Seller only)
export const inviteCollaborator = async (req, res) => {
  try {
    const { name, email, phone, password, permissions } = req.body;

    // Check if collaborator exists
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Collaborator with this email or phone already exists' });
    }

    // Create collaborator user
    const collaborator = await User.create({
      name,
      email,
      phone,
      password,
      role: 'collaborator',
      status: 'active', // Pre-verified since seller explicitly creates them
      ownerId: req.user.id, // Scoped to this seller's business
      permissions: permissions || ['content'],
      businessInfo: req.user.businessInfo, // Shares the same business profile
    });

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'INVITE_COLLABORATOR',
      details: `Invited staff collaborator ${collaborator.name} (${collaborator.email}) with permissions: ${collaborator.permissions.join(', ')}`,
      targetResource: `User:${collaborator._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Collaborator created successfully',
      data: {
        id: collaborator._id,
        name: collaborator.name,
        email: collaborator.email,
        phone: collaborator.phone,
        role: collaborator.role,
        permissions: collaborator.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all collaborators for a seller
// @route   GET /api/profile/collaborators
// @access  Private (Seller only)
export const getCollaborators = async (req, res) => {
  try {
    const collaborators = await User.find({ ownerId: req.user.id });
    res.status(200).json({ success: true, data: collaborators });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update permissions for a collaborator (FR-17.2)
// @route   PUT /api/profile/collaborators/:id
// @access  Private (Seller only)
export const updateCollaboratorPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const collaborator = await User.findOne({ _id: req.params.id, ownerId: req.user.id });

    if (!collaborator) {
      return res.status(404).json({ success: false, message: 'Collaborator not found or not owned by you' });
    }

    collaborator.permissions = permissions;
    await collaborator.save();

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'UPDATE_COLLABORATOR_PERMISSIONS',
      details: `Updated permissions for staff ${collaborator.name} to: ${permissions.join(', ')}`,
      targetResource: `User:${collaborator._id}`,
    });

    res.status(200).json({ success: true, message: 'Permissions updated successfully', data: collaborator });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a collaborator (FR-17.4)
// @route   DELETE /api/profile/collaborators/:id
// @access  Private (Seller only)
export const removeCollaborator = async (req, res) => {
  try {
    const collaborator = await User.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });

    if (!collaborator) {
      return res.status(404).json({ success: false, message: 'Collaborator not found or not owned by you' });
    }

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'REVOKE_COLLABORATOR',
      details: `Revoked access for staff collaborator ${collaborator.name} (${collaborator.email})`,
      targetResource: `User:${collaborator._id}`,
    });

    res.status(200).json({ success: true, message: 'Collaborator access revoked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get business audit logs for team activity tracking (FR-17.3)
// @route   GET /api/profile/audit-logs
// @access  Private (Seller & Collaborators)
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ businessId: req.businessId }).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
