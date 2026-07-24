import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_brandbondhu_key_2026_dev_only');

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact support.' });
    }

    req.user = user;

    // Resolve multi-tenancy business ID (all data owned at Seller level)
    if (user.role === 'seller' || user.role === 'admin') {
      req.businessId = user._id;
    } else if (user.role === 'collaborator') {
      req.businessId = user.ownerId; // Collaborator actions are scoped to their Seller's business ID
    } else {
      req.businessId = user._id; // Designers represent their own individual business/agency
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Verify collaborator specific permissions if role is collaborator
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role === 'seller' || req.user.role === 'admin') {
      // Sellers (owners) and admins automatically bypass permission checks
      return next();
    }
    if (req.user.role === 'collaborator' && req.user.permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires '${permission}' permission.`,
    });
  };
};
