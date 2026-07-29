import express from 'express';
import {
  getTemplates,
  getTemplateById,
  createCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
} from '../controllers/templateController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', checkPermission('content'), createCustomTemplate);
router.put('/:id', checkPermission('content'), updateCustomTemplate);
router.delete('/:id', checkPermission('content'), deleteCustomTemplate);

export default router;
