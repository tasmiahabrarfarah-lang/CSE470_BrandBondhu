import express from 'express';
import {
  generateBrandKit,
  getBrandKits,
  getActiveBrandKit,
  setActiveBrandKit,
  updateBrandKit,
  deleteBrandKit,
  regenerateAsset,
} from '../controllers/brandKitController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate', checkPermission('brand_kit'), generateBrandKit);
router.get('/', getBrandKits);
router.get('/active', getActiveBrandKit);
router.put('/:id/set-active', checkPermission('brand_kit'), setActiveBrandKit);
router.put('/:id', checkPermission('brand_kit'), updateBrandKit);
router.delete('/:id', checkPermission('brand_kit'), deleteBrandKit);
router.post('/:id/regenerate-asset', checkPermission('brand_kit'), regenerateAsset);

export default router;
