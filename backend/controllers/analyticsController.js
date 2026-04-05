import Analytics from '../models/Analytics.js';

export const updateWatchTime = async (req, res) => {
  const { videoId, watchDuration, completionPercentage } = req.body;
  try {
    let record = await Analytics.findOne({ videoId, studentId: req.user._id });
    if (record) {
      record.watchDuration = Math.max(record.watchDuration, watchDuration);
      record.completionPercentage = Math.max(record.completionPercentage, completionPercentage);
      await record.save();
    } else {
      record = await Analytics.create({
        videoId,
        studentId: req.user._id,
        watchDuration,
        completionPercentage
      });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'Teacher' && !req.query.videoId) {
       return res.status(400).json({ message: 'videoId required for teachers' });
    }
    if (req.query.videoId) filter.videoId = req.query.videoId;

    const data = await Analytics.find(filter).populate('studentId', 'name branch');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
