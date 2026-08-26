import express from 'express';
import {
  initiatePayment,
  confirmPayment,
  getTransactions,
  sendPaymentOTP,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initiate', protect, authorize('seller'), initiatePayment);
router.post('/confirm', protect, authorize('seller'), confirmPayment);
router.post('/send-otp', protect, authorize('seller'), sendPaymentOTP);
router.get('/history', protect, authorize('seller'), getTransactions);

export default router;
