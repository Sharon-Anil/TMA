"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiBook, FiPlay, FiArrowRight, FiLogOut, FiUser,
  FiAlertCircle, FiLoader, FiTrendingUp, FiClock
} from 'react-icons/fi';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Video {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  s3Key: string;
  courseId: string;
}

interface Course {
  _id: string;
  title: string;
  description?: string;
  branch: string;
  teacherId: { _id: string; name: string };
  videos?: Video[];
}

interface UserInfo {
  _id: string;
  name: string;
  role: string;
  branch: string;
}

const formatDuration = (secs?: number) => {
  if (!secs) return 'N/A';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

const BRANCH_ICONS: Record<string, string> = {
  'HSE Engineering': '⛑️',
  'General Duty Assistant': '🩺',
  'Hospital Administration': '🏥',
  'Ethical Hacking': '🔐',
  'SOC Analyst': '🛡️',
};

export default function StudentDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseVideos, setCourseVideos] = useState<Record<string, Video[]>>({});
  const [loadingVideos, setLoadingVideos] = useState<string | null>(null);

  // Get JWT and user info from localStorage
  const getAuthHeader = () => {
    const token = localStorage.getItem('tma_token');
    const userRaw = localStorage.getItem('tma_user');
    return {
      headers: { Authorization: `Bearer ${token}` },
      user: userRaw ? JSON.parse(userRaw) : null,
    };
  };

  useEffect(() => {
    const token = localStorage.getItem('tma_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    // Decode user info stored at login
    const userRaw = localStorage.getItem('tma_user');
    if (userRaw) {
      try { setUser(JSON.parse(userRaw)); } catch {}
    }

    fetchCourses(token);
  }, []);

  const fetchCourses = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('tma_token');
        localStorage.removeItem('tma_user');
        router.replace('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: Course[] = await res.json();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (courseId: string) => {
    if (courseVideos[courseId]) {
      setExpandedCourse(expandedCourse === courseId ? null : courseId);
      return;
    }
    setLoadingVideos(courseId);
    try {
      const token = localStorage.getItem('tma_token')!;
      const res = await fetch(`${API}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load course videos');
      const { videos } = await res.json();
      setCourseVideos(prev => ({ ...prev, [courseId]: videos }));
      setExpandedCourse(courseId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingVideos(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tma_token');
    localStorage.removeItem('tma_user');
    router.replace('/login');
  };

  const totalVideos = Object.values(courseVideos).flat().length;

  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white font-sans">
      {/* Top Nav */}
      <nav className="border-b border-white/10 bg-[#0d0e1a]/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="bg-white rounded-lg p-1">
             <img src="/logo.png" alt="Tech Meridian Academy" className="h-8 md:h-10 object-contain mix-blend-multiply" />
          </Link>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {user && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 bg-white/5 px-3 sm:px-4 py-2 rounded-full border border-white/10">
              <FiUser size={14} />
              <span className="hidden sm:inline">{user.name}</span>
              <span className="text-purple-400 font-bold">• {user.branch}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs sm:text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 sm:px-4 py-2 rounded-full border border-red-500/20 transition-all cursor-pointer"
          >
            <FiLogOut size={14} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-1">
            Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-white/50 text-lg">
            {user?.branch ? `${BRANCH_ICONS[user.branch] || '📚'} ${user.branch} Program` : 'Your learning dashboard'}
          </p>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Enrolled Courses', value: courses.length, icon: <FiBook />, color: 'from-purple-500 to-blue-500' },
            { label: 'Available Lessons', value: Object.values(courseVideos).flat().length, icon: <FiPlay />, color: 'from-pink-500 to-rose-500' },
            { label: 'Branch', value: user?.branch?.split(' ')[0] || '—', icon: <FiTrendingUp />, color: 'from-green-400 to-teal-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-lg`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-xs text-white/40 font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Course List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Your Courses</h2>
          {loading && <FiLoader className="animate-spin text-purple-400" size={18} />}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-5 mb-6"
          >
            <FiAlertCircle size={20} />
            <div>
              <p className="font-bold">Connection error</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <button
              onClick={() => fetchCourses(localStorage.getItem('tma_token')!)}
              className="ml-auto text-xs bg-red-500/20 hover:bg-red-500/40 px-4 py-2 rounded-full cursor-pointer transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && courses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white/3 border border-white/10 rounded-3xl"
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">No courses yet</h3>
            <p className="text-white/40 text-sm">Your teacher hasn't uploaded any courses for your branch yet.<br/>Check back soon!</p>
          </motion.div>
        )}

        {/* Course Cards */}
        <div className="space-y-4">
          {courses.map((course, i) => {
            const isExpanded = expandedCourse === course._id;
            const videos = courseVideos[course._id] || [];
            const isLoadingThis = loadingVideos === course._id;

            return (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-colors"
              >
                {/* Course Header */}
                <button
                  className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 text-left cursor-pointer gap-4 sm:gap-0"
                  onClick={() => fetchVideos(course._id)}
                >
                  <div className="flex items-center gap-4 border-b sm:border-none border-white/5 pb-4 sm:pb-0 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex shrink-0 items-center justify-center text-2xl font-black">
                      {BRANCH_ICONS[course.branch] || '📘'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl leading-tight text-white mb-1">{course.title}</h3>
                      <p className="text-xs sm:text-sm text-white/40 mt-0.5">
                        By {course.teacherId?.name || 'Teacher'} <span className="text-[#00d4ff] mx-1">•</span> {course.branch}
                      </p>
                      {course.description && (
                         <p className="text-xs sm:text-sm text-white/50 mt-1 line-clamp-2 md:line-clamp-1 pr-4">{course.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-0 sm:ml-4 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
                    <span className="sm:hidden text-xs font-bold text-purple-400">View Lessons</span>
                    {isLoadingThis ? (
                      <FiLoader className="animate-spin text-purple-400" size={18} />
                    ) : (
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        className="text-white/40 hover:text-purple-400 transition-colors"
                      >
                        <FiArrowRight size={18} />
                      </motion.div>
                    )}
                  </div>
                </button>

                {/* Video list expanded */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 px-6 pb-6 pt-4"
                  >
                    {videos.length === 0 ? (
                      <p className="text-white/40 text-sm italic text-center py-4">No lessons uploaded yet for this course.</p>
                    ) : (
                      <div className="grid gap-3">
                        {videos.map((video, vi) => (
                          <Link
                            key={video._id}
                            href={`/video/${video._id}`}
                            className="flex items-center gap-4 bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/40 rounded-xl p-4 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm group-hover:bg-purple-500/40 transition-colors">
                              {vi + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate group-hover:text-purple-300 transition-colors">{video.title}</p>
                              {video.description && (
                                <p className="text-xs text-white/40 truncate mt-0.5">{video.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-white/30 shrink-0">
                              <FiClock size={12} />
                              {formatDuration(video.duration)}
                            </div>
                            <FiPlay size={14} className="text-white/20 group-hover:text-purple-400 transition-colors shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
