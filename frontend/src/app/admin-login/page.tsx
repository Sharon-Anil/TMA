"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiShield, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ tokenCode: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.role !== 'Admin') throw new Error('Access denied. Admins only.');

      localStorage.setItem('tma_token', data.token);
      localStorage.setItem('tma_user', JSON.stringify({
        _id: data._id, name: data.name, role: data.role, branch: data.branch
      }));
      router.push('/admin');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(255,255,255,0.2)] p-4"
          >
            <img src="/logo.png" alt="Tech Meridian Academy" className="w-full h-full object-contain mix-blend-multiply" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Portal</h1>
          <p className="text-white/40 text-sm mt-1 font-medium">Tech Meridian Academy · Restricted Access</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-4 mb-6 text-sm"
            >
              <FiAlertCircle className="shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Username */}
            <div>
              <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-2 block">Admin Username</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-red-500/60 transition-colors">
                <FiUser size={16} className="text-white/30 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  value={form.tokenCode}
                  onChange={e => setForm(p => ({ ...p, tokenCode: e.target.value }))}
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/20 text-sm font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-2 block">Password</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-red-500/60 transition-colors">
                <FiLock size={16} className="text-white/30 mr-3 shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/20 text-sm font-medium"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/30 hover:text-white/60 ml-2 cursor-pointer transition-colors">
                  {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black py-4 rounded-xl text-sm tracking-widest uppercase shadow-[0_8px_24px_-6px_rgba(239,68,68,0.5)] hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <><FiShield size={15} /> Secure Access</>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-white/20">This portal is restricted to system administrators only.</p>
            <p className="text-xs text-white/20 mt-1">Unauthorized access attempts are logged.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
