"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FiUsers, FiBook, FiPlay, FiShield, FiLogOut, FiUser,
  FiLoader, FiAlertCircle, FiToggleLeft, FiToggleRight,
  FiTrash2, FiSearch, FiBarChart2, FiX, FiRefreshCw,
  FiUserCheck, FiUserX
} from 'react-icons/fi';

const API = 'http://localhost:5000/api';

interface User {
  _id: string;
  name: string;
  role: 'Student' | 'Teacher';
  tokenCode: string;
  branch: string;
  isActive: boolean;
  hasFaceCaptured: boolean;
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
  branch: string;
  description?: string;
  teacherId: { _id: string; name: string };
  createdAt: string;
}

interface Stats {
  students: number;
  teachers: number;
  courses: number;
  videos: number;
}

type Tab = 'overview' | 'users' | 'courses';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ name: string } | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Student' | 'Teacher'>('All');
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('tma_token')}` });

  useEffect(() => {
    const token = localStorage.getItem('tma_token');
    const u = localStorage.getItem('tma_user');
    if (!token || !u) { router.replace('/admin-login'); return; }
    try {
      const parsed = JSON.parse(u);
      if (parsed.role !== 'Admin') { router.replace('/admin-login'); return; }
      setAdmin(parsed);
    } catch { router.replace('/admin-login'); return; }

    fetchStats();
    fetchUsers();
    fetchCourses();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/admin/stats`, { headers: authHeader() });
      if (res.status === 401 || res.status === 403) { handleLogout(); return; }
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const fetchUsers = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/admin/users`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to fetch users');
      setUsers(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API}/admin/courses`, { headers: authHeader() });
      if (res.ok) setCourses(await res.json());
    } catch {}
  };

  const handleToggleBlock = async (userId: string) => {
    setTogglingId(userId);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/toggle-block`, {
        method: 'PATCH', headers: authHeader()
      });
      if (!res.ok) throw new Error('Failed to update user');
      const { isActive } = await res.json();
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive } : u));
      fetchStats();
    } catch (e: any) { alert(e.message); }
    finally { setTogglingId(null); }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const res = await fetch(`${API}/admin/users/${user._id}`, {
        method: 'DELETE', headers: authHeader()
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(prev => prev.filter(u => u._id !== user._id));
      setConfirmDelete(null);
      fetchStats();
    } catch (e: any) { alert(e.message); }
  };

  const handleLogout = () => {
    localStorage.removeItem('tma_token');
    localStorage.removeItem('tma_user');
    router.replace('/admin-login');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.tokenCode.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const STAT_CARDS = [
    { label: 'Total Students', value: stats?.students ?? '—', icon: <FiUsers />, color: 'from-blue-500 to-indigo-600', glow: 'rgba(99,102,241,0.3)' },
    { label: 'Total Teachers', value: stats?.teachers ?? '—', icon: <FiUserCheck />, color: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.3)' },
    { label: 'Total Courses', value: stats?.courses ?? '—', icon: <FiBook />, color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.3)' },
    { label: 'Total Videos', value: stats?.videos ?? '—', icon: <FiPlay />, color: 'from-rose-500 to-red-600', glow: 'rgba(239,68,68,0.3)' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white font-sans">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/3 border-r border-white/8 backdrop-blur-xl z-30 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <FiShield size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-sm tracking-tight">TMA Admin</p>
              <p className="text-[10px] text-white/40">System Control</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {([
            { id: 'overview', label: 'Overview', icon: <FiBarChart2 size={17} /> },
            { id: 'users', label: 'User Management', icon: <FiUsers size={17} /> },
            { id: 'courses', label: 'All Courses', icon: <FiBook size={17} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === item.id
                  ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-white border border-red-500/30'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div className="p-4 border-t border-white/8">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-black">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-red-400 font-bold">Super Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold">
            <FiLogOut size={13} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 min-h-screen">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tight">Platform Overview</h1>
              <p className="text-white/40 mt-1">Real-time stats from your MongoDB database</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {STAT_CARDS.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6"
                  style={{ boxShadow: `0 0 30px -10px ${s.glow}` }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-xl mb-4`}>{s.icon}</div>
                  <p className="text-3xl font-black">{s.value}</p>
                  <p className="text-xs text-white/40 font-medium mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Quick actions */}
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Manage Users', desc: 'Block, unblock or delete accounts', action: () => setTab('users'), color: 'from-blue-500 to-indigo-500' },
                { label: 'View All Courses', desc: 'Browse all courses on the platform', action: () => setTab('courses'), color: 'from-violet-500 to-purple-500' },
                { label: 'Refresh Stats', desc: 'Reload real-time platform data', action: () => { fetchStats(); fetchUsers(); fetchCourses(); }, color: 'from-emerald-500 to-teal-500' },
              ].map((a, i) => (
                <button key={i} onClick={a.action} className={`bg-gradient-to-br ${a.color} p-6 rounded-2xl text-left hover:opacity-90 transition-opacity cursor-pointer shadow-lg`}>
                  <h3 className="font-bold text-lg mb-1">{a.label}</h3>
                  <p className="text-white/70 text-sm">{a.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── USER MANAGEMENT TAB ── */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight">User Management</h1>
                <p className="text-white/40 mt-1">{filteredUsers.length} of {users.length} users shown</p>
              </div>
              <button onClick={fetchUsers} className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all cursor-pointer">
                <FiRefreshCw size={14} /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 gap-3">
                <FiSearch size={15} className="text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or token..."
                  className="bg-transparent outline-none text-sm text-white placeholder:text-white/20 w-full" />
              </div>
              {(['All', 'Student', 'Teacher'] as const).map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${roleFilter === r ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'}`}>
                  {r}
                </button>
              ))}
            </div>

            {loading && <div className="flex items-center gap-3 text-white/40 py-8"><FiLoader className="animate-spin" /> Loading users...</div>}
            {error && <div className="flex items-center gap-2 text-red-400 text-sm py-4"><FiAlertCircle />{error}</div>}

            <div className="space-y-3">
              {filteredUsers.map((user, i) => (
                <motion.div key={user._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 bg-white/5 border rounded-2xl p-4 transition-colors ${user.isActive ? 'border-white/10' : 'border-red-500/20 bg-red-500/5'}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    user.role === 'Teacher' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{user.name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${user.role === 'Teacher' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role}</span>
                      {!user.isActive && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">BLOCKED</span>}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">Token: {user.tokenCode} · {user.branch}</p>
                    <p className="text-xs text-white/30">Joined {new Date(user.createdAt).toLocaleDateString()}{user.role === 'Student' && ` · Face ID: ${user.hasFaceCaptured ? '✓' : '✗'}`}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleBlock(user._id)}
                      disabled={togglingId === user._id}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                        user.isActive
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      }`}
                    >
                      {togglingId === user._id ? <FiLoader size={12} className="animate-spin" /> : user.isActive ? <FiUserX size={12} /> : <FiUserCheck size={12} />}
                      {user.isActive ? 'Block' : 'Unblock'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(user)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      <FiTrash2 size={12} /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-16 text-white/30">
                  <FiUsers size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No users found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── COURSES TAB ── */}
        {tab === 'courses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h1 className="text-3xl font-black tracking-tight">All Courses</h1>
              <p className="text-white/40 mt-1">{courses.length} courses platform-wide</p>
            </div>
            {courses.length === 0 ? (
              <div className="text-center py-24 text-white/30">
                <FiBook size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold">No courses found</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {courses.map((c, i) => (
                  <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-violet-500/40 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-xl font-black shrink-0">
                        {c.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{c.title}</h3>
                        <p className="text-xs text-white/40 mt-0.5">By {c.teacherId?.name || 'Unknown'} · {c.branch}</p>
                        {c.description && <p className="text-xs text-white/30 mt-1 line-clamp-2">{c.description}</p>}
                        <p className="text-xs text-white/20 mt-2">Created {new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#13141f] border border-red-500/30 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiTrash2 size={24} className="text-red-400" />
              </div>
              <h2 className="text-xl font-black text-center mb-2">Delete User?</h2>
              <p className="text-white/50 text-sm text-center mb-1">
                You are about to permanently delete <span className="text-white font-bold">{confirmDelete.name}</span>.
              </p>
              {confirmDelete.role === 'Teacher' && (
                <p className="text-amber-400 text-xs text-center mb-4 font-semibold">⚠ All their courses and videos will also be deleted.</p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl text-sm cursor-pointer hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDeleteUser(confirmDelete)} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-2">
                  <FiTrash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
