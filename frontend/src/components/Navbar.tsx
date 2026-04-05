"use client";

import Link from 'next/link';
import { FiPhone, FiMail, FiClock, FiFacebook, FiTwitter, FiLinkedin, FiYoutube, FiSearch, FiHeart, FiShoppingCart, FiUser } from 'react-icons/fi';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const hiddenRoutes = ['/login', '/register', '/teacher', '/admin', '/student', '/admin-login', '/teachers'];
  const isHiddenPage = hiddenRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (isHiddenPage) return null;

  return (
    <header className="w-full bg-white flex flex-col shadow-sm relative z-50 font-sans">
      {/* Top Bar - Professional Indigo */}
      <div className="bg-[#2d3b8e] text-white text-[12px] py-2 px-6 md:px-12 flex justify-between items-center w-full">
        <div className="flex items-center gap-6 font-medium">
          <div className="flex items-center gap-2">
             <FiPhone className="text-blue-300" /> <span className="hidden sm:inline">+91 9544 568 568</span><span className="sm:hidden">Call Us</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 border-l border-white/20 pl-6">
             <FiMail className="text-blue-300" /> info@techmeridianacademy.com
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 opacity-80">
             <FiClock /> Mon - Sat: 9:00 - 18:00
          </div>
          <Link href="/login" className="flex items-center gap-2 font-bold hover:text-blue-200 transition-colors bg-white/10 px-3 py-1 rounded-lg">
             <FiUser size={14} />
             <span className="hidden sm:inline">Student Portal</span>
             <span className="sm:hidden">Login</span>
          </Link>
        </div>
      </div>

      {/* Main Nav */}
      <div className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1240px] mx-auto px-4 h-28 md:h-40 flex items-center justify-between">
           <Link href="/" className="flex items-center hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="Tech Meridian Academy"
                style={{ mixBlendMode: 'multiply' }}
                className="h-16 sm:h-24 md:h-36 w-auto object-contain"
              />
           </Link>

           {/* Clean Minimal Links */}
           <nav className="hidden md:flex items-center gap-10 font-bold text-slate-600 text-sm tracking-tight">
              <Link href="/" className="text-[#2d3b8e] hover:opacity-80 transition-opacity">Home</Link>
              <Link href="#features" className="hover:text-[#2d3b8e] transition-colors">Why Us</Link>
              <Link href="#courses" className="hover:text-[#2d3b8e] transition-colors">Courses</Link>
           </nav>

           {/* Right Side CTA */}
           <div className="flex items-center gap-4">
              <Link href="/register" className="bg-[#a86db4] text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black hover:bg-[#8e5c98] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-center whitespace-nowrap">
                 GET STARTED
              </Link>
           </div>
        </div>
      </div>
    </header>
  );
}
