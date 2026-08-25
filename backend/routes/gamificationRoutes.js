import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getGamificationProfile,
  toggleLeaderboardOptIn,
  getLeaderboard,
} from '../controllers/gamificationController.js';

const router = express.Router();

// Apply auth middleware to protect and restrict all gamification routes
router.use(protect);
router.use(authorize('seller', 'collaborator', 'admin'));

router.get('/profile', getGamificationProfile);
router.put('/leaderboard/toggle', toggleLeaderboardOptIn);
router.get('/leaderboard', getLeaderboard);

export default router;
