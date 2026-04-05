"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiBook, FiPlus, FiUploadCloud, FiLoader, FiLogOut,
  FiUser, FiTrash2, FiBarChart2, FiX, FiCheck,
  FiArrowRight, FiPlay, FiAlertCircle, FiClock, FiUsers, FiChevronDown
} from 'react-icons/fi';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Video {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  s3Key: string;
  courseId: string;
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
  description?: string;
  branch: string;
  teacherId: { _id: string; name: string };
  createdAt: string;
}

interface Analytics {
  _id: string;
  studentId: { _id: string; name: string; branch: string };
  watchDuration: number;
  completionPercentage: number;
}

interface UserInfo {
  _id: string;
  name: string;
  role: string;
  branch: string;
}

const hiddenRoutes = ['/login', '/register', '/teacher', '/admin', '/student', '/admin-login', '/teachers'];
const BRANCHES = ['HSE Engineering', 'General Duty Assistant', 'Hospital Administration', 'Ethical Hacking', 'SOC Analyst'];
const fmt = (secs?: number) => secs ? `${Math.floor(secs / 60)}m ${secs % 60}s` : 'N/A';

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseVideos, setCourseVideos] = useState<Record<string, Video[]>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showUploadVideo, setShowUploadVideo] = useState<string | null>(null); // courseId
  const [showAnalytics, setShowAnalytics] = useState<string | null>(null); // videoId
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({ title: '', description: '', branch: BRANCHES[0] });
  const [videoForm, setVideoForm] = useState({ title: '', description: '', duration: '' });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const getToken = () => localStorage.getItem('tma_token') || '';
  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/teachers'); return; }
    const u = localStorage.getItem('tma_user');
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/courses`, { headers: authHeader() });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error('Failed to fetch courses');
      setCourses(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (courseId: string) => {
    if (courseVideos[courseId]) {
      setExpandedCourse(expandedCourse === courseId ? null : courseId);
      return;
    }
    try {
      const res = await fetch(`${API}/courses/${courseId}`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to load videos');
      const { videos } = await res.json();
      setCourseVideos(prev => ({ ...prev, [courseId]: videos }));
      setExpandedCourse(courseId);
    } catch (e: any) { alert(e.message); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/courses`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create course');
      setCourses(prev => [data, ...prev]);
      setCourseForm({ title: '', description: '', branch: BRANCHES[0] });
      setShowCreateCourse(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadVideo = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    if (!videoFile) { alert('Please select a video file'); return; }
    setSubmitting(true);
    setUploadProgress(10);  // show immediate feedback

    try {
      // Step 1: Get presigned URL
      const urlRes = await fetch(`${API}/videos/upload-url`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: videoFile.name, contentType: videoFile.type })
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, key } = await urlRes.json();

      // Step 2: Upload directly to S3 using XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 90)); // reserve 10% for backend save
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error('Direct S3 upload failed'));
        };
        xhr.onabort = () => reject(new Error('Upload Cancelled'));
        xhr.onerror = () => reject(new Error('Network error during S3 upload'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', videoFile.type);
        xhr.send(videoFile);
      });

      setUploadProgress(95);

      // Step 3: Save to database
      const saveRes = await fetch(`${API}/videos`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           ...videoForm, 
           courseId, 
           s3Key: key 
        })
      });
      if (!saveRes.ok) throw new Error('Failed to save video record');
      const newVideo = await saveRes.json();


      // Update local state with new video
      setCourseVideos(prev => ({
        ...prev,
        [courseId]: [newVideo, ...(prev[courseId] || [])]
      }));
      setVideoForm({ title: '', description: '', duration: '' });
      setVideoFile(null);
      setShowUploadVideo(null);
      setExpandedCourse(courseId);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
      xhrRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setSubmitting(false);
    setUploadProgress(0);
  };


  const fetchAnalytics = async (videoId: string) => {
    setShowAnalytics(videoId);
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await fetch(`${API}/analytics?videoId=${videoId}`, { headers: authHeader() });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error ${res.status}`);
      }
      setAnalytics(await res.json());
    } catch (e: any) {
      setAnalytics([]);
      setAnalyticsError(e.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };


  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    const confirmed = window.confirm(
      `Delete "${courseTitle}"?\n\nThis will permanently delete the course and ALL its video lessons. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API}/courses/${courseId}`, {
        method: 'DELETE',
        headers: authHeader()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete course');
      }
      // Remove from local state
      setCourses(prev => prev.filter(c => c._id !== courseId));
      setCourseVideos(prev => { const n = { ...prev }; delete n[courseId]; return n; });
      if (expandedCourse === courseId) setExpandedCourse(null);
      if (showUploadVideo === courseId) setShowUploadVideo(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tma_token');
    localStorage.removeItem('tma_user');
    router.replace('/teachers');
  };

  const totalVideos = Object.values(courseVideos).flat().length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/">
             <img src="/logo.png" alt="Tech Meridian Academy" className="h-8 md:h-10 object-contain mix-blend-multiply" />
          </Link>
          <div className="border-l border-slate-200 pl-3 hidden sm:block">
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest leading-none">Instructor</p>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight mt-1">Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {user && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 bg-slate-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hidden sm:flex">
              <FiUser size={14} />
              <span className="font-semibold">{user.name.split(' ')[0]}</span>
              <span className="text-[#f44bad] font-bold text-[10px] sm:text-xs">• Teacher</span>
            </div>
          )}
          <button
            onClick={() => setShowCreateCourse(true)}
            className="flex items-center gap-1 sm:gap-2 bg-[#2d3b8e] hover:bg-[#1e2a6e] text-white text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer shadow-md shrink-0"
          >
            <FiPlus size={14} /> <span className="hidden sm:inline">New Course</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer shrink-0">
            <FiLogOut size={14} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-1 text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Teacher'} 👋
          </h1>
          <p className="text-slate-400 text-lg">Manage your courses and track student progress.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Courses', value: courses.length, icon: <FiBook />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Videos Loaded', value: totalVideos, icon: <FiPlay />, color: 'text-pink-600 bg-pink-50' },
            { label: 'Role', value: 'Instructor', icon: <FiUsers />, color: 'text-purple-600 bg-purple-50' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 mb-6">
            <FiAlertCircle />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={fetchCourses} className="ml-auto text-xs bg-red-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-red-200">Retry</button>
          </div>
        )}

        {/* Courses */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            Your Courses
            {loading && <FiLoader className="animate-spin text-slate-400" size={18} />}
          </h2>
        </div> {!loading && courses.length === 0 && !error && (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
            <FiBook size={40} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-600 mb-2">No courses yet</h3>
            <p className="text-slate-400 text-sm mb-6">Click "New Course" to create your first course.</p>
            <button onClick={() => setShowCreateCourse(true)} className="bg-[#2d3b8e] text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-[#1e2a6e] transition-colors">
              + Create First Course
            </button>
          </div>
        )}

        <div className="space-y-4">
          {courses.map((course, i) => {
            const isExp = expandedCourse === course._id;
            const videos = courseVideos[course._id] || [];

            return (
              <motion.div key={course._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                <div className="flex items-center justify-between p-6">
                  <button className="flex items-center gap-4 text-left flex-1 cursor-pointer" onClick={() => fetchVideos(course._id)}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2d3b8e] to-[#f44bad] flex items-center justify-center text-white font-black text-lg">
                      {course.title.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 leading-tight">{course.title}</h3>
                      <p className="text-sm text-slate-400 mt-0.5">{course.branch} · {new Date(course.createdAt).toLocaleDateString()}</p>
                      {course.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{course.description}</p>}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => { setShowUploadVideo(course._id); setExpandedCourse(course._id); }}
                      className="flex items-center gap-1.5 text-xs bg-[#2d3b8e]/10 text-[#2d3b8e] hover:bg-[#2d3b8e]/20 px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      <FiUploadCloud size={13} /> Upload Video
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id, course.title)}
                      className="flex items-center gap-1.5 text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer"
                      title="Delete course and all its videos"
                    >
                      <FiTrash2 size={13} /> Delete
                    </button>
                    <motion.button animate={{ rotate: isExp ? 180 : 0 }}
                      onClick={() => fetchVideos(course._id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <FiChevronDown size={16} />
                    </motion.button>
                  </div>
                </div>

                {/* Upload Video Form (inline) */}
                <AnimatePresence>
                  {showUploadVideo === course._id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200 bg-blue-50/50 px-6 py-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm sm:text-base"><FiUploadCloud className="text-[#2d3b8e]" /> Upload New Lesson</h4>
                        <button onClick={() => setShowUploadVideo(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><FiX /></button>
                      </div>
                      <form onSubmit={(e) => handleUploadVideo(e, course._id)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input required value={videoForm.title} onChange={e => setVideoForm(p => ({ ...p, title: e.target.value }))}
                          placeholder="Lesson title *" className="col-span-2 border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2d3b8e] bg-white" />
                        <input value={videoForm.description} onChange={e => setVideoForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Description (optional)" className="border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2d3b8e] bg-white" />
                        <input value={videoForm.duration} onChange={e => setVideoForm(p => ({ ...p, duration: e.target.value }))}
                          placeholder="Duration in seconds (e.g. 300)" type="number" className="border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2d3b8e] bg-white" />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="col-span-2 border-2 border-dashed border-slate-300 hover:border-[#2d3b8e] rounded-xl p-5 text-center cursor-pointer transition-colors"
                        >
                          <FiUploadCloud size={24} className="mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500 font-medium">{videoFile ? videoFile.name : 'Click to select video file'}</p>
                          <p className="text-xs text-slate-400 mt-1">MP4, MOV, AVI — max 1GB</p>
                          <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                            onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="col-span-2">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Uploading to S3...</span><span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-[#2d3b8e] h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <div className="flex justify-center mt-3">
                              <button type="button" onClick={handleCancelUpload} className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer flex items-center gap-1">
                                <FiX size={12} /> Cancel Upload
                              </button>
                            </div>
                          </div>
                        )}
                        {!submitting && (
                          <button type="submit" disabled={submitting}
                            className="col-span-2 bg-[#2d3b8e] text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-60 cursor-pointer hover:bg-[#1e2a6e] flex items-center justify-center gap-2">
                            <FiUploadCloud /> Upload Lesson
                          </button>
                        )}
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Video List */}
                <AnimatePresence>
                  {isExp && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 px-6 pb-5 pt-4">
                      {videos.length === 0 ? (
                        <p className="text-slate-400 text-sm italic text-center py-4">No lessons uploaded yet. Click "Upload Video" to add one.</p>
                      ) : (
                        <div className="space-y-2">
                          {videos.map((v, vi) => (
                            <div key={v._id} className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 transition-colors group">
                              <div className="w-9 h-9 rounded-lg bg-[#2d3b8e]/10 text-[#2d3b8e] flex items-center justify-center text-sm font-bold shrink-0">
                                {vi + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-slate-900 truncate">{v.title}</p>
                                {v.description && <p className="text-xs text-slate-400 truncate">{v.description}</p>}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                                <FiClock size={12} /> {fmt(v.duration)}
                              </div>
                              <button
                                onClick={() => fetchAnalytics(v._id)}
                                className="flex items-center gap-1 text-xs bg-pink-50 text-[#f44bad] hover:bg-pink-100 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer shrink-0"
                              >
                                <FiBarChart2 size={12} /> Analytics
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* ── CREATE COURSE MODAL ── */}
      <AnimatePresence>
        {showCreateCourse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateCourse(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900">Create New Course</h2>
                <button onClick={() => setShowCreateCourse(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><FiX size={22} /></button>
              </div>
              <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Course Title *</label>
                  <input required value={courseForm.title}
                    onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Introduction to HSE Safety"
                    className="w-full border-2 border-slate-200 focus:border-[#2d3b8e] rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea rows={3} value={courseForm.description}
                    onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of what students will learn..."
                    className="w-full border-2 border-slate-200 focus:border-[#2d3b8e] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Target Branch *</label>
                  <select required value={courseForm.branch}
                    onChange={e => setCourseForm(p => ({ ...p, branch: e.target.value }))}
                    className="w-full border-2 border-slate-200 focus:border-[#2d3b8e] rounded-xl px-4 py-3 text-sm outline-none transition-colors bg-white cursor-pointer">
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={submitting}
                  className="bg-[#2d3b8e] text-white font-black py-4 rounded-xl mt-2 transition-all disabled:opacity-60 cursor-pointer hover:bg-[#1e2a6e] flex items-center justify-center gap-2">
                  {submitting ? <><FiLoader className="animate-spin" /> Creating...</> : <><FiCheck /> Create Course</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ANALYTICS MODAL ── */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowAnalytics(null); setAnalytics([]); setAnalyticsError(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><FiBarChart2 className="text-[#f44bad]" /> Lesson Analytics</h2>
                <button onClick={() => { setShowAnalytics(null); setAnalytics([]); setAnalyticsError(null); }} className="text-slate-400 hover:text-slate-700 cursor-pointer"><FiX size={22} /></button>
              </div>

              {analyticsLoading ? (
                <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                  <FiLoader size={28} className="animate-spin" />
                  <p className="text-sm">Loading analytics...</p>
                </div>
              ) : analyticsError ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiAlertCircle size={22} className="text-red-400" />
                  </div>
                  <p className="font-bold text-slate-700 mb-1">Could not load analytics</p>
                  <p className="text-sm text-red-400 mb-4">{analyticsError}</p>
                  <button
                    onClick={() => { setAnalyticsError(null); fetchAnalytics(showAnalytics!); }}
                    className="text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Retry
                  </button>
                  <p className="text-xs text-slate-400 mt-4">Try logging out and back in if this persists.</p>
                </div>
              ) : analytics.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <FiUsers size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="font-bold">No watch data yet</p>
                  <p className="text-sm mt-1">Students haven't watched this lesson yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 font-medium mb-4">{analytics.length} student{analytics.length !== 1 ? 's' : ''} watched this lesson</p>
                  {analytics.map(a => (
                    <div key={a._id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{a.studentId?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{a.studentId?.branch}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg text-[#2d3b8e]">{Math.round(a.completionPercentage)}%</p>
                          <p className="text-xs text-slate-400">complete</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-[#2d3b8e] to-[#f44bad] h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, a.completionPercentage)}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Watch time: {fmt(a.watchDuration)}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
