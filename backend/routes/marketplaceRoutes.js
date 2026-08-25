import express from 'express';
import {
  getDesigners,
  getDesignerProfile,
  requestJob,
  getJobs,
  getJobById,
  acceptJob,
  submitDeliverables,
  approveDeliverables,
  requestRevision,
  postMessage,
  submitReview,
  raiseDispute,
  resolveDispute,
} from '../controllers/marketplaceController.js';
import { protect, authorize, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (Guests can browse designers)
router.get('/designers', getDesigners);
router.get('/designers/:id', getDesignerProfile);

// Protected routes
router.use(protect);

router.get('/jobs', getJobs);
router.get('/jobs/:id', getJobById);
router.post('/jobs', checkPermission('marketplace'), requestJob);
router.put('/jobs/:id/accept', authorize('designer'), acceptJob);
router.put('/jobs/:id/deliver', authorize('designer'), submitDeliverables);
router.put('/jobs/:id/approve', checkPermission('marketplace'), approveDeliverables);
router.put('/jobs/:id/revision', checkPermission('marketplace'), requestRevision);
router.post('/jobs/:id/messages', postMessage);
router.post('/jobs/:id/review', submitReview);
router.put('/jobs/:id/dispute', raiseDispute);

// Admin dispute resolution route
router.put('/jobs/:id/resolve-dispute', authorize('admin'), resolveDispute);

export default router;
