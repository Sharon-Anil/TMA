import crypto from 'crypto';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getDownloadPresignedUrl, getUploadPresignedUrl } from '../utils/s3Service.js';
import Video from '../models/Video.js';

// Multer — store file in memory buffer
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  }
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// POST /api/videos/upload  (multipart/form-data)
export const uploadVideo = async (req, res) => {
  try {
    const { title, description, courseId, duration } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No video file provided' });
    if (!title || !courseId) return res.status(400).json({ message: 'title and courseId are required' });

    const key = `videos/${crypto.randomUUID()}-${file.originalname.replace(/\s+/g, '_')}`;

    // Stream upload to S3 with progress support
    const uploader = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'tma-videos-sharonanil555',
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
      queueSize: 4,      // concurrent part uploads
      partSize: 5 * 1024 * 1024, // 5MB per chunk
    });

    await uploader.done();

    // Save video record to MongoDB
    const video = await Video.create({
      title,
      description: description || '',
      courseId,
      s3Key: key,
      duration: duration ? parseInt(duration) : undefined,
      teacherId: req.user._id
    });

    res.status(201).json(video);
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/videos/:id/url — returns a presigned download URL
export const getVideoUrl = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const url = await getDownloadPresignedUrl(video.s3Key);
    res.json({ videoUrl: url, title: video.title });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESTORED DIRECT UPLOAD ENDPOINTS FOR SPEED

export const getUploadUrl = async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) return res.status(400).json({ message: 'filename and contentType required' });

    const key = `videos/${crypto.randomUUID()}-${filename.replace(/\s+/g, '_')}`;
    const uploadUrl = await getUploadPresignedUrl(key, contentType);

    res.json({ uploadUrl, key });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVideoRecord = async (req, res) => {
  try {
    const { title, description, courseId, duration, s3Key } = req.body;
    if (!title || !courseId || !s3Key) {
      return res.status(400).json({ message: 'title, courseId, and s3Key are required' });
    }

    const video = await Video.create({
      title,
      description: description || '',
      courseId,
      s3Key,
      duration: duration ? parseInt(duration) : undefined,
      teacherId: req.user._id
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
