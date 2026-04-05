"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const floatAnim = {
  y: [0, -15, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function Home() {
  const slides = [
    {
      img: '/hero1.png',
      accent: '#f5c518',
      tag: "Kerala's #1 Job-Focused Academy",
      headline: 'Improve Your',
      highlight: 'Skills Faster',
      sub: 'Speed up your skill acquisition with placement-focused courses that match your career goals in Healthcare, IT & Safety.',
      cta1: 'Start Learning Today',
      cta2: 'View Courses',
    },
    {
      img: '/hero2.png',
      accent: '#ff6b35',
      tag: '100% Placement Focused Training',
      headline: 'Earn Your',
      highlight: 'Certification',
      sub: 'Get industry-recognized certifications in HSE Engineering, General Duty, and Hospital Administration that employers trust.',
      cta1: 'Enroll Now',
      cta2: 'View Courses',
    },
    {
      img: '/hero3.png',
      accent: '#00b4a6',
      tag: 'Expert Instructors • Live + Recorded',
      headline: 'Learn From',
      highlight: 'The Best',
      sub: 'Expert-led online classes with lifetime access. Learn at your pace with 24/7 recorded sessions and live doubt clearing.',
      cta1: 'Register Free',
      cta2: 'View Courses',
    },
    {
      img: '/hero4.png',
      accent: '#a86db4',
      tag: 'IT • Healthcare • Industrial Safety',
      headline: 'Land Your',
      highlight: 'Dream Job',
      sub: 'From SOC Analyst to Ethical Hacker — our industry courses guarantee you are job-ready from day one.',
      cta1: 'Get Started',
      cta2: 'View Courses',
    },
  ];

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };
  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  const slide = slides[current];

  const courses = [
    { title: "HSE ENGINEERING", subtitle: "Industrial Standard", duration: "12 WEEKS", color: "from-yellow-300 to-amber-500 shadow-amber-400", img: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&q=80" },
    { title: "GENERAL DUTY (GEN)", subtitle: "Healthcare", duration: "08 WEEKS", color: "from-orange-400 to-[#ff5e00] shadow-[#ff5e00]", img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80" },
    { title: "GENERAL DUTY (NCVET)", subtitle: "Certified Course", duration: "08 WEEKS", color: "from-rose-400 to-pink-500 shadow-pink-400", img: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=500&q=80" },
    { title: "HOSPITAL ADMIN", subtitle: "Management", duration: "24 WEEKS", color: "from-cyan-300 to-blue-500 shadow-blue-400", img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=500&q=80" },
    { title: "ETHICAL HACKER", subtitle: "Cyber Security", duration: "16 WEEKS", color: "from-[#4ade80] to-[#059669] shadow-[#34d399]", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80" },
    { title: "SOC ANALYST", subtitle: "Security Ops", duration: "16 WEEKS", color: "from-indigo-400 to-purple-600 shadow-indigo-400", img: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=500&q=80" }
  ];

  return (
    <main className="min-h-screen bg-[#f8f9fc] font-sans pb-20">
      
      {/* ── HERO SLIDESHOW ── */}
      <section className="w-full relative overflow-hidden bg-[#1a1a2e]" style={{ minHeight: '92vh' }}>

        {/* Slide Images with crossfade */}
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0"
          >
            <img src={slide.img} alt="hero" className="w-full h-full object-cover object-center" />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 h-full flex flex-col justify-center" style={{ minHeight: '92vh' }}>
          <div className="flex flex-col items-start justify-center py-24 max-w-2xl">

            {/* Accent badge */}
            <AnimatePresence mode="wait">
              <motion.div key={current + '-badge'}
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-6 text-sm font-bold text-white backdrop-blur-sm border border-white/20"
                style={{ backgroundColor: slide.accent + '33' }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: slide.accent }} />
                {slide.tag}
              </motion.div>
            </AnimatePresence>


            {/* Headline */}
            <AnimatePresence mode="wait">
              <motion.h1 key={current + '-h1'}
                initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.5 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4"
              >
                {slide.headline}{' '}
                <span className="px-3 py-1 rounded-xl" style={{ backgroundColor: slide.accent, color: '#1a1a1a' }}>
                  {slide.highlight}
                </span>
              </motion.h1>
            </AnimatePresence>

            {/* Sub */}
            <AnimatePresence mode="wait">
              <motion.p key={current + '-p'}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-white/80 text-lg md:text-xl leading-relaxed mb-10 font-medium"
              >
                {slide.sub}
              </motion.p>
            </AnimatePresence>

            {/* CTAs */}
            <AnimatePresence mode="wait">
              <motion.div key={current + '-cta'}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <Link href="/register"
                  className="font-black text-base px-8 py-4 rounded-full shadow-xl hover:-translate-y-1 transition-all duration-300 text-[#1a1a1a]"
                  style={{ backgroundColor: slide.accent }}
                >
                  {slide.cta1} →
                </Link>
                <Link href="#courses"
                  className="font-bold text-base px-8 py-4 rounded-full border-2 border-white/40 text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                >
                  {slide.cta2}
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button onClick={prev} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all">
          <FiChevronLeft size={22} />
        </button>
        <button onClick={next} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all">
          <FiChevronRight size={22} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {slides.map((s, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === current ? 32 : 10,
                height: 10,
                backgroundColor: i === current ? slide.accent : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 52C120 44 240 28 360 24C480 20 600 28 720 32C840 36 960 36 1080 32C1200 28 1320 20 1380 16L1440 12V60H0Z" fill="#f8f9fc"/>
          </svg>
        </div>
      </section>


      {/* 2. Animated Features Section */}
      <section id="features" className="w-full py-24 px-4 md:px-8 max-w-[1200px] mx-auto overflow-hidden">
         <div className="text-center mb-24">
            <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">
               Why Choose Tech Meridian?
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-xl text-slate-500 font-medium">
               Everything you need to master high-demand practical skills.
            </motion.p>
         </div>

         <div className="flex flex-col gap-28">
            {/* Feature 1: Mentor Support */}
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
               <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="w-full md:w-1/2 relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-[3rem] -rotate-6 transform origin-bottom-left transition-transform hover:-rotate-12 duration-500"></div>
                  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Mentor Support" className="relative z-10 w-full h-[380px] object-cover rounded-[3rem] shadow-2xl" />
                  <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -bottom-8 -right-4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 z-20 border border-slate-50">
                     <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">👨‍🏫</div>
                     <div><p className="font-bold text-slate-800 leading-tight">1-on-1</p><p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Mentorship</p></div>
                  </motion.div>
               </motion.div>
               <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full md:w-1/2">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-6">Expert Mentor Support</h3>
                  <p className="text-lg text-slate-500 leading-relaxed mb-8 font-medium">We don't just hand you videos. Our industry-expert mentors provide dedicated guidance, answer your complex questions, and ensure you're never stuck on a concept.</p>
                  <ul className="space-y-4 font-bold text-slate-700 text-lg">
                     <li className="flex items-center gap-3"><span className="text-[#a86db4] text-xl">✓</span> Responsive Live Q&A Sessions</li>
                     <li className="flex items-center gap-3"><span className="text-[#a86db4] text-xl">✓</span> One-on-One Career Counseling</li>
                     <li className="flex items-center gap-3"><span className="text-[#a86db4] text-xl">✓</span> Personalized Feedback</li>
                  </ul>
               </motion.div>
            </div>

            {/* Feature 2: Recorded Classes */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-20">
               <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="w-full md:w-1/2 relative">
                  <div className="absolute inset-0 bg-purple-100 rounded-[3rem] rotate-6 transform origin-bottom-right transition-transform hover:rotate-12 duration-500"></div>
                  <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80" alt="Recorded Online Classes" className="relative z-10 w-full h-[380px] object-cover rounded-[3rem] shadow-2xl" />
                  <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="absolute -top-8 -left-4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 z-20 border border-slate-50">
                     <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-2xl">📹</div>
                     <div><p className="font-bold text-slate-800 leading-tight">24/7 Access</p><p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Recorded Video</p></div>
                  </motion.div>
               </motion.div>
               <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full md:w-1/2">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-6">Online Recorded Classes</h3>
                  <p className="text-lg text-slate-500 leading-relaxed mb-8 font-medium">Learn effectively at your own pace. All our masterclasses are securely recorded and available in our portal, allowing you to re-watch complex topics fully.</p>
                  <ul className="space-y-4 font-bold text-slate-700 text-lg">
                     <li className="flex items-center gap-3"><span className="text-[#a86db4] text-xl">✓</span> Anti-Piracy DRM Videos</li>
                     <li className="flex items-center gap-3"><span className="text-[#a86db4] text-xl">✓</span> High-Quality 4K Streaming</li>
                     <li className="flex items-center gap-3"><span className="text-[#a86db4] text-xl">✓</span> Lifetime Valid Access</li>
                  </ul>
               </motion.div>
            </div>
         </div>
      </section>

      {/* 3. Pop-out Card Courses Section */}
      <section id="courses" className="w-full pb-32 px-4 md:px-8 max-w-[1400px] mx-auto overflow-hidden">
         <div className="flex justify-between items-center mb-10 max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
               TMS Courses
            </h2>
            <div className="hidden md:flex gap-6 font-bold text-slate-400">
               <button className="hover:text-slate-800 transition-colors">&lt; Prev</button>
               <button className="text-slate-800 hover:text-slate-600 transition-colors">Next &gt;</button>
            </div>
         </div>

         {/* Horizontal Scroll Container */}
         <div className="flex overflow-x-auto gap-6 lg:gap-8 pb-16 pt-28 px-4 snap-x hide-scrollbar max-w-[1200px] mx-auto mask-edges">
            {courses.map((course, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative mt-8 w-[260px] md:w-[280px] shrink-0 snap-center group">
                 {/* The 3D Pop-out Image (No cartoons) */}
                 <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[220px] h-[220px] z-10 transition-transform group-hover:-translate-y-4 duration-500 ease-out">
                    <img src={course.img} alt={course.title} className="w-full h-full object-cover rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-4 border-white" />
                 </div>

                 {/* The Colored Gradient Card */}
                 <div className={`w-full pt-[110px] pb-10 px-8 rounded-[3rem] bg-gradient-to-t ${course.color} text-center md:text-left text-white shadow-[0_20px_40px_-15px_var(--tw-shadow-color)] transition-all group-hover:shadow-[0_25px_50px_-12px_var(--tw-shadow-color)] group-hover:scale-[1.02] duration-500`}>
                    <h3 className="text-[22px] font-black leading-tight mb-2 min-h-[60px] tracking-tight">{course.title}</h3>
                    <p className="text-white/80 text-sm font-semibold tracking-wide">{course.subtitle}</p>
                 </div>
              </motion.div>
            ))}
         </div>
         
         <style dangerouslySetInnerHTML={{__html: `
           .hide-scrollbar::-webkit-scrollbar { display: none; }
           .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
           .mask-edges { -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); }
         `}} />
      </section>

      {/* 4. Form Section */}
      <section className="w-full px-4 md:px-8 max-w-[1200px] mx-auto pb-10">
         <div className="bg-[#7a5af8] rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
            <div className="text-left flex-1 text-white">
               <h2 className="text-3xl md:text-4xl font-black mb-4">CONFUSED ABOUT <br/> WHICH COURSE?</h2>
               <p className="text-purple-100 mb-6 font-medium">Leave a request for a free consultation: we'll help you decide where to start and answer all your questions.</p>
               <p className="text-white/70 text-sm italic">Expected wait time: 15 minutes</p>
            </div>

            <form className="w-full md:w-[400px] flex flex-col gap-4">
               <input type="text" placeholder="Your Name" className="w-full bg-white rounded-full px-6 py-4 outline-none font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-purple-400/50 transition-all"/>
               <input type="tel" placeholder="Phone Number" className="w-full bg-white rounded-full px-6 py-4 outline-none font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-purple-400/50 transition-all"/>
               <button type="button" className="w-full bg-[#facc15] hover:bg-yellow-300 text-[#5b3eb8] font-black text-lg px-6 py-4 rounded-full mt-2 shadow-[0_6px_0_#ca8a04] hover:translate-y-1 hover:shadow-[0_2px_0_#ca8a04] transition-all active:translate-y-2 active:shadow-none">
                  LEAVE REQUEST
               </button>
               <p className="text-[10px] text-purple-200/60 text-center mt-2 px-6">By clicking the button, you agree to the processing of personal data</p>
            </form>
         </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full py-12 flex justify-center items-center bg-transparent mt-10 perspective-[800px]">
         <motion.div 
            animate={{ rotateX: [10, -10, 10], rotateY: [-15, 15, -15], y: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="px-8 py-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-[0_20px_40px_rgba(0,0,0,0.4)] transform-style-3d flex items-center gap-3 relative overflow-hidden group"
         >
             {/* Glowing back-light effect */}
             <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-0" />
             
             {/* Pulsing indicator */}
             <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_#4ade80] animate-pulse z-10" />
             
             {/* 3D text */}
             <span className="text-white font-black tracking-widest text-xs z-10" style={{ textShadow: '0px 2px 0px rgba(0,0,0,1)' }}>
                 DEVELOPED BY SHARON ANIL
             </span>
             
             {/* Reflection sweep */}
             <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-[sweep_4s_ease-in-out_Infinity] z-10" />
         </motion.div>
         <style dangerouslySetInnerHTML={{__html: `
            @keyframes sweep {
              0% { left: -100%; }
              50% { left: 200%; }
              100% { left: 200%; }
            }
         `}} />
      </footer>

    </main>
  );
}
