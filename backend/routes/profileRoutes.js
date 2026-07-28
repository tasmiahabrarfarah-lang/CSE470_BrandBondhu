import express from 'express';
import {
  updateProfile,
  inviteCollaborator,
  getCollaborators,
  updateCollaboratorPermissions,
  removeCollaborator,
  getAuditLogs,
} from '../controllers/profileController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/', protect, updateProfile);
router.get('/audit-logs', protect, getAuditLogs);

// Collaborator sub-account endpoints (restricted to primary Seller/Owner)
router.post('/collaborators', protect, authorize('seller'), inviteCollaborator);
router.get('/collaborators', protect, authorize('seller'), getCollaborators);
router.put('/collaborators/:id', protect, authorize('seller'), updateCollaboratorPermissions);
router.delete('/collaborators/:id', protect, authorize('seller'), removeCollaborator);

export default router;
