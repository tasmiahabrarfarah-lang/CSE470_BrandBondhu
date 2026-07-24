import express from 'express';
import {
  initiatePayment,
  confirmPayment,
  getTransactions,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initiate', protect, authorize('seller'), initiatePayment);
router.post('/confirm', protect, authorize('seller'), confirmPayment);
router.get('/history', protect, authorize('seller'), getTransactions);

export default router;
