"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FiUser, FiLock, FiBook, FiHash, FiLogIn, FiUserPlus, FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiArrowLeft } from 'react-icons/fi';

const API = 'http://localhost:5000/api';
const BRANCHES = ['HSE Engineering', 'General Duty Assistant', 'Hospital Administration', 'Ethical Hacking', 'SOC Analyst'];

export default function TeacherAuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({ tokenCode: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', tokenCode: '', password: '', confirmPassword: '', branch: BRANCHES[0] });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.role !== 'Teacher') throw new Error('Access denied. Teachers only.');
      localStorage.setItem('tma_token', data.token);
      localStorage.setItem('tma_user', JSON.stringify({ _id: data._id, name: data.name, role: data.role, branch: data.branch }));
      router.push('/teacher');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          tokenCode: registerForm.tokenCode,
          password: registerForm.password,
          branch: registerForm.branch,
          role: 'Teacher',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setSuccess('Account created! You can now log in.');
      setTab('login');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1b5e] via-[#1a2d8f] to-[#2d3b8e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-[#00d4ff]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#a86db4]/10 rounded-full blur-[100px] pointer-events-none" />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Home */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm font-medium mb-6">
          <FiArrowLeft size={14} /> Back to Home
        </Link>

        {/* Logo Card */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-2xl px-8 py-4 shadow-2xl">
            <img src="/logo.png" alt="Tech Meridian Academy" style={{ mixBlendMode: 'multiply' }} className="h-16 w-auto object-contain" />
          </div>
        </div>

        <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
          {/* Tab Header */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-sm font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${tab === 'login' ? 'bg-white/10 text-white border-b-2 border-[#00d4ff]' : 'text-white/40 hover:text-white/70'}`}
            >
              <FiLogIn size={15} /> Instructor Login
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-sm font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${tab === 'register' ? 'bg-white/10 text-white border-b-2 border-[#a86db4]' : 'text-white/40 hover:text-white/70'}`}
            >
              <FiUserPlus size={15} /> Register
            </button>
          </div>

          <div className="p-8">
            {/* Error / Success */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-2xl px-4 py-3 mb-5 text-sm font-medium">
                  <FiAlertCircle className="shrink-0" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 text-green-300 rounded-2xl px-4 py-3 mb-5 text-sm font-medium">
                  <FiCheck className="shrink-0" /> {success}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* ── LOGIN TAB ── */}
              {tab === 'login' && (
                <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }} onSubmit={handleLogin} className="flex flex-col gap-4">

                  <div>
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-2 block">Token ID</label>
                    <div className="flex items-center bg-white/8 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#00d4ff]/60 transition-colors">
                      <FiHash size={15} className="text-white/30 mr-3 shrink-0" />
                      <input type="text" placeholder="TCH001" required value={loginForm.tokenCode}
                        onChange={e => setLoginForm(p => ({ ...p, tokenCode: e.target.value }))}
                        className="w-full bg-transparent outline-none text-white placeholder:text-white/20 text-sm font-medium" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-2 block">Password</label>
                    <div className="flex items-center bg-white/8 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#00d4ff]/60 transition-colors">
                      <FiLock size={15} className="text-white/30 mr-3 shrink-0" />
                      <input type={showPw ? 'text' : 'password'} placeholder="••••••••" required value={loginForm.password}
                        onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                        className="w-full bg-transparent outline-none text-white placeholder:text-white/20 text-sm font-medium" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/30 hover:text-white/60 ml-2">
                        {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                    className="mt-2 w-full bg-gradient-to-r from-[#00d4ff] to-[#0095b3] text-[#0d1b5e] font-black py-4 rounded-xl text-sm tracking-widest uppercase shadow-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                    {loading ? <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : <><FiLogIn size={15} /> Sign In as Instructor</>}
                  </motion.button>
                </motion.form>
              )}

              {/* ── REGISTER TAB ── */}
              {tab === 'register' && (
                <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }} onSubmit={handleRegister} className="flex flex-col gap-4">

                  <div>
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-2 block">Full Name</label>
                    <div className="flex items-center bg-white/8 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#a86db4]/60 transition-colors">
                      <FiUser size={15} className="text-white/30 mr-3 shrink-0" />
                      <input type="text" placeholder="John Smith" required value={registerForm.name}
                        onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-transparent outline-none text-white placeholder:text-white/20 text-sm font-medium" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-2 block">Token ID</label>
                    <div className="flex items-center bg-white/8 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#a86db4]/60 transition-colors">
                      <FiHash size={15} className="text-white/30 mr-3 shrink-0" />
                      <input type="text" placeholder="TCH001" required value={registerForm.tokenCode}
                        onChange={e => setRegisterForm(p => ({ ...p, tokenCode: e.target.value }))}
                        className="w-full bg-transparent outline-none text-white placeholder:text-white/20 text-sm font-medium" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-2 block">Branch / Subject</label>
                    <div className="flex items-center bg-white/8 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#a86db4]/60 transition-colors">
                      <FiBook size={15} className="text-white/30 mr-3 shrink-0" />
                      <select value={registerForm.branch} onChange={e => setRegisterForm(p => ({ ...p, branch: e.target.value }))}
                        className="w-full bg-transparent outline-none text-white text-sm font-medium [&>option]:bg-[#1a2d8f] [&>option]:text-white">
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-2 block">Password</label>
                    <div className="flex items-center bg-white/8 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#a86db4]/60 transition-colors">
                      <FiLock size={15} className="text-white/30 mr-3 shrink-0" />
                      <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" required value={registerForm.password}
                        onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                        className="w-full bg-transparent outline-none text-white placeholder:text-white/20 text-sm font-medium" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/30 hover:text-white/60 ml-2">
                        {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-2 block">Confirm Password</label>
                    <div className="flex items-center bg-white/8 border border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#a86db4]/60 transition-colors">
                      <FiLock size={15} className="text-white/30 mr-3 shrink-0" />
                      <input type={showPw ? 'text' : 'password'} placeholder="Re-enter password" required value={registerForm.confirmPassword}
                        onChange={e => setRegisterForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        className="w-full bg-transparent outline-none text-white placeholder:text-white/20 text-sm font-medium" />
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                    className="mt-2 w-full bg-gradient-to-r from-[#a86db4] to-[#8e5c98] text-white font-black py-4 rounded-xl text-sm tracking-widest uppercase shadow-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                    {loading ? <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : <><FiUserPlus size={15} /> Create Instructor Account</>}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-white/25 text-xs mt-6">
          This portal is for <span className="text-white/50 font-bold">Instructors only</span>. Students go to <Link href="/login" className="text-[#00d4ff]/60 hover:text-[#00d4ff] underline">Student Portal</Link>.
        </p>
      </motion.div>
    </div>
  );
}
