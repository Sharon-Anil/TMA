"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiPlay, FiPause, FiVolume2, FiVolumeX,
  FiMaximize, FiMinimize, FiLoader, FiAlertCircle,
  FiCheckCircle, FiClock, FiBookOpen, FiRotateCcw, FiRotateCw
} from 'react-icons/fi';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface VideoInfo {
  title: string;
  videoUrl: string;
}

interface UserInfo {
  _id: string;
  name: string;
  tokenCode?: string;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function VideoPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params?.id as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const analyticsTimer = useRef<NodeJS.Timeout | null>(null);
  const lastReportedSeconds = useRef(0);

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Player states
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [completed, setCompleted] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('tma_token')}` });

  useEffect(() => {
    const token = localStorage.getItem('tma_token');
    if (!token) { router.replace('/login'); return; }
    const u = localStorage.getItem('tma_user');
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
    fetchVideoUrl();

    // Disable right-click to prevent easy download
    const block = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    return () => {
      document.removeEventListener('contextmenu', block);
      if (analyticsTimer.current) clearInterval(analyticsTimer.current);
    };
  }, []);

  const fetchVideoUrl = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/videos/${videoId}/url`, { headers: authHeader() });
      if (res.status === 401) { router.replace('/login'); return; }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to load video');
      }
      const data = await res.json();
      setVideoInfo(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Report watch analytics to backend
  const reportAnalytics = useCallback(async (watchDuration: number, completionPct: number) => {
    try {
      await fetch(`${API}/analytics/watch-time`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          watchDuration: Math.round(watchDuration),
          completionPercentage: Math.round(completionPct)
        })
      });
    } catch { /* silently fail — don't interrupt playback */ }
  }, [videoId]);

  // Start sending analytics every 10 seconds of playback
  useEffect(() => {
    if (!playing || !videoRef.current) return;
    analyticsTimer.current = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || !vid.duration) return;
      const pct = (vid.currentTime / vid.duration) * 100;
      reportAnalytics(vid.currentTime, pct);
    }, 10000);

    return () => {
      if (analyticsTimer.current) clearInterval(analyticsTimer.current);
    };
  }, [playing, reportAnalytics]);

  // Video event handlers
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setCurrentTime(vid.currentTime);
    if (vid.buffered.length > 0) {
      setBuffered((vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100);
    }
  };

  const handleVideoEnd = () => {
    setPlaying(false);
    setCompleted(true);
    if (videoRef.current) {
      reportAnalytics(videoRef.current.duration, 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  // Controls
  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setPlaying(true); }
    else { vid.pause(); setPlaying(false); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const vid = videoRef.current;
    if (!bar || !vid) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    vid.currentTime = pct * vid.duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const skip = (seconds: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + seconds));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); skip(-5); }
      if (e.key === 'ArrowRight') { e.preventDefault(); skip(5); }
      if (e.key === ' ')          { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playing]);

  // Auto-hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const t = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
    setControlsTimeout(t);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white font-sans">

      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/8 bg-[#0a0b14]/90 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <FiArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="flex-1 text-center">
          <p className="font-bold text-sm truncate px-8">
            {videoInfo?.title || (loading ? 'Loading...' : 'Video Player')}
          </p>
        </div>
        {user && (
          <span className="text-xs text-white/30 shrink-0">
            Watching as <span className="text-purple-400 font-bold">{user.name}</span>
          </span>
        )}
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-white/40">
            <FiLoader size={36} className="animate-spin text-purple-400" />
            <p className="text-sm font-medium">Loading video from S3...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <FiAlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-red-400 font-bold text-lg">Failed to load video</p>
            <p className="text-white/40 text-sm text-center max-w-sm">{error}</p>
            <button
              onClick={fetchVideoUrl}
              className="mt-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Video Player */}
        {!loading && videoInfo && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Completion Banner */}
            <AnimatePresence>
              {completed && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl px-5 py-4 mb-5 font-semibold text-sm"
                >
                  <FiCheckCircle size={18} />
                  Lesson complete! Your progress has been saved. 🎉
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <h1 className="text-2xl font-black mb-4 tracking-tight">{videoInfo.title}</h1>

            {/* Player Container */}
            <div
              ref={containerRef}
              onMouseMove={showControlsTemporarily}
              onMouseLeave={() => playing && setShowControls(false)}
              onClick={togglePlay}
              className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_60px_-20px_rgba(139,92,246,0.4)] border border-white/10 cursor-pointer group"
            >
              {/* Video element */}
              <video
                ref={videoRef}
                src={videoInfo.videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={handleVideoEnd}
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                playsInline
              />

              {/* Moving Watermark */}
              {playing && user && (
                <motion.div
                  animate={{ x: ['0%', '60%', '20%', '80%', '0%'], y: ['0%', '70%', '30%', '10%', '0%'] }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="absolute pointer-events-none text-white/20 font-bold text-sm mix-blend-overlay rotate-[15deg] whitespace-nowrap z-10 select-none top-4 left-4"
                >
                  TMA · {user.name}
                </motion.div>
              )}

              {/* Center play/pause indicator */}
              <AnimatePresence>
                {!playing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                      <FiPlay size={32} className="text-white ml-1" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Custom Controls Overlay */}
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-5 pb-4 pt-12"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Progress bar */}
                    <div
                      ref={progressBarRef}
                      onClick={handleSeek}
                      className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer relative group/bar"
                    >
                      {/* Buffer */}
                      <div
                        className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                        style={{ width: `${buffered}%` }}
                      />
                      {/* Progress */}
                      <div
                        className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                      {/* Thumb */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity"
                        style={{ left: `calc(${progress}% - 7px)` }}
                      />
                    </div>

                    {/* Control buttons */}
                    <div className="flex items-center gap-3">
                      {/* Rewind 5s */}
                      <button
                        onClick={() => skip(-5)}
                        title="Rewind 5 seconds (←)"
                        className="flex flex-col items-center text-white/70 hover:text-white transition-colors cursor-pointer group/skip"
                      >
                        <FiRotateCcw size={17} />
                        <span className="text-[9px] font-bold opacity-60 group-hover/skip:opacity-100">5s</span>
                      </button>

                      {/* Play / Pause */}
                      <button onClick={togglePlay} className="text-white hover:text-purple-400 transition-colors cursor-pointer">
                        {playing ? <FiPause size={22} /> : <FiPlay size={22} />}
                      </button>

                      {/* Forward 5s */}
                      <button
                        onClick={() => skip(5)}
                        title="Forward 5 seconds (→)"
                        className="flex flex-col items-center text-white/70 hover:text-white transition-colors cursor-pointer group/skip2"
                      >
                        <FiRotateCw size={17} />
                        <span className="text-[9px] font-bold opacity-60 group-hover/skip2:opacity-100">5s</span>
                      </button>

                      {/* Volume */}
                      <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors cursor-pointer">
                        {muted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                      </button>
                      <input
                        type="range" min="0" max="1" step="0.05"
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-purple-500 cursor-pointer"
                      />

                      {/* Time */}
                      <span className="text-xs text-white/50 font-mono ml-1">
                        {fmt(currentTime)} / {fmt(duration)}
                      </span>

                      <div className="flex-1" />

                      {/* Fullscreen */}
                      <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors cursor-pointer">
                        {fullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress Summary */}
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                { label: 'Watch Time', value: fmt(currentTime), icon: <FiClock size={14} /> },
                { label: 'Duration', value: fmt(duration), icon: <FiBookOpen size={14} /> },
                {
                  label: 'Completion',
                  value: `${Math.round(progress)}%`,
                  icon: <FiCheckCircle size={14} />,
                },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-4 flex items-center gap-3">
                  <div className="text-purple-400">{s.icon}</div>
                  <div>
                    <p className="text-sm font-black">{s.value}</p>
                    <p className="text-[10px] text-white/30 font-medium">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Completion progress bar */}
            <div className="mt-4 bg-white/5 border border-white/8 rounded-2xl p-5">
              <div className="flex justify-between text-xs text-white/40 mb-2 font-medium">
                <span>Your progress</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
              <p className="text-[10px] text-white/20 mt-2">
                Progress is auto-saved every 10 seconds and visible to your teacher.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
