import React from 'react';
import { motion } from 'motion/react';

export default function Splash() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center overflow-hidden relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50" />
      
      <motion.div
        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center justify-center"
      >
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-24 md:h-32 shrink-0"
          >
            <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="howzyGradSplash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <path d="M 20 70 L 20 40 L 50 15 L 80 40 L 80 90" stroke="url(#howzyGradSplash)" strokeWidth="14" strokeLinecap="butt" strokeLinejoin="miter" />
              <rect x="42" y="52" width="6" height="6" fill="#0f172a" />
              <rect x="52" y="52" width="6" height="6" fill="#0f172a" />
              <rect x="42" y="62" width="6" height="6" fill="#0f172a" />
              <rect x="52" y="62" width="6" height="6" fill="#0f172a" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ maxWidth: 0, opacity: 0, marginLeft: 0 }}
            animate={{ maxWidth: 500, opacity: 1, marginLeft: 16 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeInOut" }}
            className="overflow-hidden flex items-baseline whitespace-nowrap"
          >
            <span className="text-6xl md:text-8xl font-black tracking-tight text-slate-900">howzy</span>
            <span className="text-2xl md:text-3xl font-bold text-indigo-600 ml-1 md:ml-2">.in</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: "easeOut" }}
          className="mt-6 text-lg md:text-2xl font-bold text-slate-500 tracking-[0.2em] uppercase text-center"
        >
          Grow Big <span className="text-indigo-600">Earn Big</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
