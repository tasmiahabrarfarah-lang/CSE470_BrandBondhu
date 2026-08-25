import express from 'express';
import {
  generateHashtagsAndSEO,
  saveHashtagTemplate,
  getHashtagTemplates,
  updateHashtagTemplate,
  deleteHashtagTemplate,
} from '../controllers/hashtagController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate', checkPermission('content'), generateHashtagsAndSEO);
router.get('/templates', getHashtagTemplates);
router.post('/templates', checkPermission('content'), saveHashtagTemplate);
router.put('/templates/:id', checkPermission('content'), updateHashtagTemplate);
router.delete('/templates/:id', checkPermission('content'), deleteHashtagTemplate);

export default router;
