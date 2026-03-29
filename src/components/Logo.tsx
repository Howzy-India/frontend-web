import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  dark?: boolean;
  animated?: boolean;
}

export default function Logo({ className = "h-10", dark = false, animated = false }: LogoProps) {
  const iconAnimation = animated ? {
    initial: { rotate: -180, opacity: 0, scale: 0.5 },
    animate: { rotate: 0, opacity: 1, scale: 1 },
    transition: { duration: 0.8, ease: "easeOut" as const }
  } : {};

  const textAnimation = animated ? {
    initial: { maxWidth: 0, opacity: 0, marginLeft: 0 },
    animate: { maxWidth: 200, opacity: 1, marginLeft: 8 },
    transition: { duration: 0.8, delay: 0.8, ease: "easeInOut" as const }
  } : {};

  return (
    <div className={`flex items-center ${className}`}>
      <motion.div 
        className="h-full shrink-0"
        {...iconAnimation}
      >
        <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="howzyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" /> {/* purple-400 */}
              <stop offset="100%" stopColor="#4f46e5" /> {/* indigo-600 */}
            </linearGradient>
          </defs>
          {/* City skyline background */}
          {dark && (
            <path d="M25 60 V30 H35 V20 H50 V40 H60 V10 H75 V60" stroke="#334155" strokeWidth="1" fill="none" />
          )}
          {/* Main house shape */}
          <path d="M 20 70 L 20 40 L 50 15 L 80 40 L 80 90" stroke="url(#howzyGrad)" strokeWidth="14" strokeLinecap="butt" strokeLinejoin="miter" />
          {/* Window */}
          <rect x="42" y="52" width="6" height="6" fill={dark ? "white" : "#0f172a"} />
          <rect x="52" y="52" width="6" height="6" fill={dark ? "white" : "#0f172a"} />
          <rect x="42" y="62" width="6" height="6" fill={dark ? "white" : "#0f172a"} />
          <rect x="52" y="62" width="6" height="6" fill={dark ? "white" : "#0f172a"} />
        </svg>
      </motion.div>
      
      <motion.div 
        className="overflow-hidden flex items-baseline whitespace-nowrap"
        {...textAnimation}
        style={!animated ? { marginLeft: '8px' } : undefined}
      >
        <span className={`text-3xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>howzy</span>
        <span className="text-sm font-bold text-indigo-600 ml-0.5">.in</span>
      </motion.div>
    </div>
  );
}
