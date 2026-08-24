import express from 'express';
import {
  getStyleGuide,
  updateStyleGuideConfig,
  exportStyleGuidePDF,
} from '../controllers/styleGuideController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('brand_kit'), getStyleGuide);
router.get('/:brandKitId', checkPermission('brand_kit'), getStyleGuide);
router.put('/:brandKitId', checkPermission('brand_kit'), updateStyleGuideConfig);
router.get('/:brandKitId/export', checkPermission('brand_kit'), exportStyleGuidePDF);

export default router;
