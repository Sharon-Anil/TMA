import Course from '../models/Course.js';
import Video from '../models/Video.js';

export const createCourse = async (req, res) => {
  const { title, description, branch } = req.body;
  try {
    const course = await Course.create({
      title,
      description,
      branch,
      teacherId: req.user._id
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'Student') {
      filter.branch = req.user.branch;
    } else if (req.user.role === 'Teacher') {
      filter.teacherId = req.user._id;
    } // Admin sees all
    
    const courses = await Course.find(filter).populate('teacherId', 'name');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacherId', 'name');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    const videos = await Video.find({ courseId: course._id });
    res.json({ course, videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Only the owning teacher (or admin) can delete
    if (req.user.role !== 'Admin' && course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // Delete all videos under this course first
    await Video.deleteMany({ courseId: course._id });
    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course and its videos deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
