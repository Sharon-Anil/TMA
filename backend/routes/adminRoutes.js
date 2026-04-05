import express from 'express';
import { getAllUsers, toggleUserBlock, deleteUser, getPlatformStats, getAllCourses } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, adminOnly, getPlatformStats);
router.get('/users', protect, adminOnly, getAllUsers);
router.patch('/users/:id/toggle-block', protect, adminOnly, toggleUserBlock);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.get('/courses', protect, adminOnly, getAllCourses);

export default router;
