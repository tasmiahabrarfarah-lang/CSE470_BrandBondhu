import express from 'express';
import {
  getPlans,
  getMySubscription,
  consumeCredits,
} from '../controllers/subscriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/plans', getPlans);
router.get('/my', protect, getMySubscription);
router.post('/consume', protect, authorize('seller', 'collaborator'), consumeCredits);

export default router;
