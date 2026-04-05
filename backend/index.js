import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';

dotenv.config();

const app = express();
app.use(cors({
    origin: ['http://localhost:3000', 'https://tech-meridian-academy.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LMS Backend is running' });
});

import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to DB", err);
  process.exit(1);
});
