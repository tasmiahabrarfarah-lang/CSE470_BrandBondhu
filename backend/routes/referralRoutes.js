import express from 'express';
import {
  getMyReferrals,
  validateReferralCode,
  getReferralStats,
} from '../controllers/referralController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to validate code during signup
router.get('/validate/:code', validateReferralCode);

// Authenticated routes
router.get('/my', protect, getMyReferrals);
router.get('/admin/stats', protect, authorize('admin'), getReferralStats);

export default router;
