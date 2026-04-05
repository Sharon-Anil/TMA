import express from 'express';
import { createCourse, getCourses, getCourseById, deleteCourse } from '../controllers/courseController.js';
import { protect, teacherOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, teacherOrAdmin, createCourse)
  .get(protect, getCourses);

router.get('/:id', protect, getCourseById);
router.delete('/:id', protect, teacherOrAdmin, deleteCourse);

export default router;
