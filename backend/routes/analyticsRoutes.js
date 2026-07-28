import express from 'express';
import { getSentimentAnalysis, syncCommentsMock, getCompetitors, addCompetitor, getDashboardStats } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// FR-5
router.get('/sentiment', getSentimentAnalysis);
router.post('/sentiment/sync', syncCommentsMock);

// FR-6
router.get('/competitors', getCompetitors);
router.post('/competitors', addCompetitor);

// FR-9
router.get('/dashboard', getDashboardStats);

export default router;
