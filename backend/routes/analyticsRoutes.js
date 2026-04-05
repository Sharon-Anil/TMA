import express from 'express';
import { updateWatchTime, getAnalytics } from '../controllers/analyticsController.js';
import { protect, teacherOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/watch-time', protect, updateWatchTime);
router.get('/', protect, teacherOrAdmin, getAnalytics);

export default router;
