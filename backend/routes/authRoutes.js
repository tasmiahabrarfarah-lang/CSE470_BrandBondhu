import express from 'express';
import {
  register,
  verifyOTP,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  deactivateAccount,
  deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/deactivate', protect, deactivateAccount);
router.delete('/delete', protect, deleteAccount);

export default router;
