"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FaceCapture from '@/components/FaceCapture';
import { FiUser, FiLock, FiBookOpen, FiHash, FiChevronLeft } from 'react-icons/fi';

export default function RegisterPage() {
  const [role, setRole] = useState<'Student'>('Student');
  const [formData, setFormData] = useState({ name: '', tokenCode: '', password: '', branch: 'HSE Engineering' });
  const [faceBlob, setFaceBlob] = useState<Blob | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'Student' && !faceBlob) {
        alert("Face ID capture is required for students.");
        return;
    }
    if (role === 'Student' && !faceDescriptor) {
        alert("Face could not be processed. Please retake your photo.");
        return;
    }

    try {
        // faceEncodingId = JSON stringified 128-float descriptor (no Python needed)
        const faceEncodingId = faceDescriptor ? JSON.stringify(faceDescriptor) : null;
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                role,
                faceEncodingId
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');

        localStorage.setItem('tma_token', data.token);
        localStorage.setItem('tma_user', JSON.stringify({
          _id: data._id,
          name: data.name,
          role: data.role,
          branch: formData.branch
        }));

        if (role === 'Student') {
            router.push('/student');
        } else {
            router.push('/teacher');
        }
    } catch (error: any) {
        alert(error.message);
    }
  };


  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-[#121316] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-[-150px] right-[-50px] w-[600px] h-[600px] bg-[#6c38eb]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] bg-[#00d4ff]/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl relative z-10 flex flex-col items-center"
      >
        {/* Back and Logo */}
        <div className="w-full flex justify-between items-center mb-6 px-4">
            <Link href="/" className="text-white/40 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
              <FiChevronLeft size={16} /> Home
            </Link>
        </div>

        {/* ── STUDENT REGISTRATION FORM ── */}
        <div className="w-full bg-[#1b1d24] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
            
            {/* Left Side: Form */}
            <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-center relative order-2 md:order-1">
              <div className="mb-8">
                 <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Create Account.</h2>
                 <p className="text-white/50 font-medium tracking-wide">Join Tech Meridian Academy today.</p>
              </div>
              
              <form onSubmit={handleRegister} className="flex flex-col gap-5">
                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
                       <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest pl-1 relative z-10">Full Name</label>
                       <div className="flex items-center bg-[#14151a] border border-white/5 rounded-2xl px-4 py-3 focus-within:border-[#8e5c98]/60 transition-all">
                         <FiUser className="text-[#a86db4] mr-2 text-lg shrink-0" />
                         <input type="text" placeholder="John Doe" className="w-full bg-transparent outline-none text-white font-medium placeholder:text-white/20 text-sm" onChange={e => setFormData({...formData, name: e.target.value})} required />
                       </div>
                    </div>
                    <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
                       <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest pl-1 relative z-10">Token ID</label>
                       <div className="flex items-center bg-[#14151a] border border-white/5 rounded-2xl px-4 py-3 focus-within:border-[#8e5c98]/60 transition-all">
                         <FiHash className="text-[#a86db4] mr-2 text-lg shrink-0" />
                         <input type="text" placeholder="STU001" className="w-full bg-transparent outline-none text-white font-medium placeholder:text-white/20 text-sm" onChange={e => setFormData({...formData, tokenCode: e.target.value})} required />
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
                       <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest pl-1 relative z-10">Branch</label>
                       <div className="flex items-center bg-[#14151a] border border-white/5 rounded-2xl px-4 py-3 focus-within:border-[#8e5c98]/60 transition-all">
                         <FiBookOpen className="text-[#a86db4] mr-2 text-lg shrink-0" />
                         <select className="w-full bg-transparent outline-none text-white font-medium text-sm cursor-pointer [&>option]:bg-[#1a1d24] [&>option]:text-white" onChange={e => setFormData({...formData, branch: e.target.value})} required>
                           <option>HSE Engineering</option>
                           <option>General Duty Assistant</option>
                           <option>Hospital Administration</option>
                           <option>Ethical Hacking</option>
                           <option>SOC Analyst</option>
                         </select>
                       </div>
                    </div>
                    <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
                       <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest pl-1 relative z-10">Password</label>
                       <div className="flex items-center bg-[#14151a] border border-white/5 rounded-2xl px-4 py-3 focus-within:border-[#8e5c98]/60 transition-all">
                         <FiLock className="text-[#a86db4] mr-2 text-lg shrink-0" />
                         <input type="password" placeholder="••••••••" className="w-full bg-transparent outline-none text-white font-medium placeholder:text-white/20 text-sm" onChange={e => setFormData({...formData, password: e.target.value})} required />
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col gap-2 mt-2">
                    <label className="text-[10px] uppercase font-bold text-[#6c38eb] tracking-widest flex items-center gap-2 relative z-10 pl-1"><div className="w-1.5 h-1.5 bg-[#6c38eb] rounded-full animate-pulse"></div> Face Authentication Required</label>
                    <div className="bg-[#14151a] border border-white/5 p-2 rounded-3xl relative overflow-hidden group shadow-inner">
                       <div className="rounded-[1.5rem] overflow-hidden mask-face">
                          <FaceCapture
                             onCapture={(blob, descriptor) => { setFaceBlob(blob); setFaceDescriptor(descriptor); }}
                             onRetake={() => { setFaceBlob(null); setFaceDescriptor(null); }}
                           />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-gradient-to-r from-[#6c38eb] to-[#8e5c98] text-white font-bold tracking-wider text-sm py-4 rounded-2xl mt-2 shadow-[0_10px_30px_rgba(108,56,235,0.3)] hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2">
                    Complete Registration
                 </button>
                 
                 <p className="mt-2 text-center text-white/40 font-medium text-sm">
                    Already have an account? <Link href="/login" className="text-white hover:text-[#6c38eb] transition-colors font-bold tracking-wide">Login here</Link>
                 </p>
              </form>
            </div>

            {/* Right Side: 3D Illustration matching reference */}
            <div className="w-full md:w-5/12 bg-[#22242c] p-12 flex flex-col items-center justify-center relative overflow-hidden hidden md:flex border-l border-white/5 order-1 md:order-2">
              <div className="absolute top-8 right-8 bg-[#1b1d24] rounded-2xl px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/5 z-20">
                <img src="/logo.png" alt="Tech Meridian Academy" style={{ mixBlendMode: 'plus-lighter' }} className="h-10 w-auto opacity-70" />
              </div>

              {/* The big circular vibrant gradient */}
              <div className="absolute w-[320px] h-[320px] bg-gradient-to-br from-[#ffd571] via-[#ff7eb3] to-[#8e5c98] rounded-full blur-[2px] opacity-80 z-0"></div>

              <div className="relative z-10 w-full flex justify-center items-center translate-y-6">
                 {/* 3D abstract object floaters */}
                 <motion.div animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-4 top-4 bg-[#2d303b]/80 backdrop-blur-md border border-white/10 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-2xl z-20">
                    🚀
                 </motion.div>
                 
                 <motion.div animate={{ y: [0, 15, 0], rotate: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -right-6 bottom-16 bg-[#2d303b]/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-full shadow-xl flex items-center gap-2 z-20">
                    <div className="w-3 h-3 bg-[#00d4ff] rounded-full"></div>
                    <div className="flex flex-col gap-1.5">
                       <div className="w-6 h-1 bg-white/40 rounded-full"></div>
                       <div className="w-10 h-1 bg-white/20 rounded-full"></div>
                    </div>
                 </motion.div>

                 {/* Drop shadow */}
                 <div className="w-48 h-8 bg-black/60 rounded-full absolute -bottom-8 blur-2xl opacity-90 z-0"></div>
                 {/* Premium 3D tech / student image */}
                 <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80" className="w-[240px] h-[320px] object-cover rounded-[2rem] border-4 border-[#22242c] shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform hover:scale-[1.02] transition-transform duration-500 relative z-10 filter contrast-[1.1] brightness-[0.9]" alt="3D Aesthetic" />
              </div>
            </div>
        </div>
      </motion.div>
      
      {/* Scope specific face capture overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .mask-face video { border-radius: 1.5rem !important; }
        .mask-face button { margin-top: 10px !important; margin-bottom: 10px !important; border-radius: 1rem !important; font-weight: bold !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; font-size: 0.8rem !important; padding: 12px 20px !important; background: #2d303b !important; color: white !important; border: 1px solid rgba(255,255,255,0.1) !important; }
      `}} />
    </div>
  );
}
