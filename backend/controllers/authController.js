import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { sendOTP, sendEmail } from '../utils/email.js';

// Helper to generate JWT Token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_brandbondhu_key_2026_dev_only',
    { expiresIn: '30d' }
  );

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        businessInfo: user.businessInfo,
        portfolioInfo: user.portfolioInfo,
        ownerId: user.ownerId,
        profilePicture: user.profilePicture
      },
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, businessName, industry } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
    }

    // Role safety (Collaborators are created by Sellers, not via open signup)
    if (role === 'admin' || role === 'collaborator') {
      return res.status(400).json({ success: false, message: 'Invalid role signup selection' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const userFields = {
      name,
      email,
      phone,
      password,
      role: role || 'seller',
      status: 'pending',
      verificationOTP: otp,
      verificationExpires: otpExpires,
    };

    if (role === 'seller') {
      userFields.businessInfo = {
        businessName: businessName || `${name}'s Business`,
        industry: industry || 'Retail',
      };
    }

    const user = await User.create(userFields);

    // Seed empty subscription
    await Subscription.create({
      userId: user._id,
      tier: 'free',
      status: 'active',
      credits: { current: 20, total: 20 },
    });

    // Send OTP email/SMS mock
    await sendOTP(email, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verify using the OTP code sent to your email.',
      verificationRequired: true,
      email,
      // Pass OTP in development responses for quick automated workflows
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP for account activation
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ success: false, message: 'Account is already verified and active' });
    }

    if (user.verificationOTP !== otp || user.verificationExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.status = 'active';
    user.verificationOTP = null;
    user.verificationExpires = null;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      // Regenerate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOTP = otp;
      user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOTP(email, otp);

      return res.status(403).json({
        success: false,
        message: 'Account is pending verification. A new OTP has been sent.',
        verificationRequired: true,
        email,
        otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact Support.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact Support.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password - Request OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTP(email, otp);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email.',
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.passwordResetOTP !== otp || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset OTP' });
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetOTP = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate Account
// @route   POST /api/auth/deactivate
// @access  Private
export const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.status = 'deactivated';
    await user.save();

    res.status(200).json({ success: true, message: 'Account successfully deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Account
// @route   DELETE /api/auth/delete
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    await Subscription.findOneAndDelete({ userId: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ success: true, message: 'Account permanently deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seed default administrator account if none exists
export const seedDefaultAdmin = async () => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Seeding default admin user...');
      await User.create({
        name: 'System Administrator',
        email: 'admin@brandbondhu.com',
        phone: '01900000000',
        password: 'adminpassword123',
        role: 'admin',
        status: 'active',
      });
      console.log('Default admin user seeded successfully.');
    }
  } catch (error) {
    console.error('Failed to seed default admin:', error.message);
  }
};
