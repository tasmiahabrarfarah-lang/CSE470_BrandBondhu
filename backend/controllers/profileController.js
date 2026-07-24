import User from '../models/User.js';

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
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite/Create a collaborator (Staff)
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

// @desc    Update permissions for a collaborator
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

    res.status(200).json({ success: true, message: 'Permissions updated successfully', data: collaborator });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a collaborator
// @route   DELETE /api/profile/collaborators/:id
// @access  Private (Seller only)
export const removeCollaborator = async (req, res) => {
  try {
    const collaborator = await User.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });

    if (!collaborator) {
      return res.status(404).json({ success: false, message: 'Collaborator not found or not owned by you' });
    }

    res.status(200).json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
