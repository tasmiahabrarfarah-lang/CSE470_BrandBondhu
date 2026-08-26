import express from 'express';
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../controllers/faqController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFAQs)
  .post(createFAQ);

router.route('/:id')
  .put(updateFAQ)
  .delete(deleteFAQ);

export default router;
