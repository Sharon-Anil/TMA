import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  watchDuration: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Analytics', analyticsSchema);
