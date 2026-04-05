import User from '../models/User.js';
import Course from '../models/Course.js';
import Video from '../models/Video.js';

// GET all users (excluding admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'Admin' } }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH block or unblock a user
export const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'Admin') return res.status(403).json({ message: 'Cannot block admin accounts' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE a user and all their courses/videos
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'Admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });

    if (user.role === 'Teacher') {
      const courses = await Course.find({ teacherId: user._id });
      for (const c of courses) {
        await Video.deleteMany({ courseId: c._id });
      }
      await Course.deleteMany({ teacherId: user._id });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET platform stats
export const getPlatformStats = async (req, res) => {
  try {
    const [students, teachers, courses, videos] = await Promise.all([
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Teacher' }),
      Course.countDocuments(),
      Video.countDocuments()
    ]);
    res.json({ students, teachers, courses, videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET all courses with teacher info (admin overview)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('teacherId', 'name branch').sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
