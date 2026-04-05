import express from 'express';
import { upload, uploadVideo, getVideoUrl, getUploadUrl, createVideoRecord } from '../controllers/videoController.js';
import { protect, teacherOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// New: multipart upload through Node.js
router.post('/upload', protect, teacherOrAdmin, upload.single('video'), uploadVideo);

// Legacy stubs (return 410)
router.post('/upload-url', protect, teacherOrAdmin, getUploadUrl);
router.post('/', protect, teacherOrAdmin, createVideoRecord);

// Presigned download URL
router.get('/:id/url', protect, getVideoUrl);

export default router;
