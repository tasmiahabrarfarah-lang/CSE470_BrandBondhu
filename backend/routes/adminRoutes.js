import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getDisputes,
  resolveDispute,
  getPlatformAnalytics,
  updateSubscriptionTier,
} from '../controllers/adminController.js';

const router = express.Router();

// Apply auth middleware to protect and restrict all admin routes to Admin role only
router.use(protect);
router.use(authorize('admin'));

// User Accounts routes
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);
router.delete('/users/:id', deleteUser);

// Dispute moderation routes
router.get('/disputes', getDisputes);
router.put('/disputes/:id/resolve', resolveDispute);

// Platform stats routes
router.get('/analytics', getPlatformAnalytics);

// Subscription Tiers pricing management
router.put('/pricing-tiers/:id', updateSubscriptionTier);

export default router;
