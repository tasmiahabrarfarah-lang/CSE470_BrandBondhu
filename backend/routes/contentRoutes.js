import express from 'express';
import {
  generateCaption,
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  triggerPostReminders,
} from '../controllers/contentController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate-caption', checkPermission('content'), generateCaption);
router.post('/posts', checkPermission('content'), createPost);
router.get('/posts', getPosts);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', checkPermission('content'), updatePost);
router.delete('/posts/:id', checkPermission('content'), deletePost);
router.post('/posts/trigger-reminders', triggerPostReminders);

export default router;
