import express from 'express';
import { generateTokens, getTokens } from '../controllers/tokenController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, adminOnly, generateTokens)
  .get(protect, adminOnly, getTokens);

export default router;
