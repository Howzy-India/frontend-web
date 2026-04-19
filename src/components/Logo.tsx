import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  dark?: boolean;
  animated?: boolean;
}

export default function Logo({ className = "h-10", dark = false, animated = false }: LogoProps) {
  const iconAnimation = animated ? {
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: "easeOut" as const }
  } : {};

  const textAnimation = animated ? {
    initial: { maxWidth: 0, opacity: 0, marginLeft: 0 },
    animate: { maxWidth: 220, opacity: 1, marginLeft: 6 },
    transition: { duration: 0.6, delay: 0.4, ease: "easeInOut" as const }
  } : {};

  const skylineColor = dark ? '#64748b' : '#94a3b8';
  const windowColor = dark ? '#1e293b' : '#1e293b';

  return (
    <div className={`flex items-center ${className}`}>
      <motion.div
        className="h-full shrink-0"
        {...iconAnimation}
      >
        <svg viewBox="0 0 110 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="howzyGrad" x1="0%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
          </defs>
          {/* City skyline — top right */}
          <g stroke={skylineColor} strokeWidth="1.5" fill="none" strokeLinejoin="miter">
            {/* Tall thin tower */}
            <rect x="68" y="8" width="5" height="38" />
            <rect x="70" y="4" width="1.5" height="6" />
            {/* Mid building */}
            <rect x="75" y="22" width="8" height="24" />
            <rect x="76" y="18" width="2" height="6" />
            {/* Short wide building */}
            <rect x="85" y="30" width="12" height="16" />
            {/* Connecting base */}
            <line x1="65" y1="46" x2="100" y2="46" />
          </g>
          {/* House / arrow icon — gradient */}
          <path
            d="M 10 78 L 10 46 L 42 18 L 74 46 L 74 90"
            stroke="url(#howzyGrad)"
            strokeWidth="13"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
          />
          {/* Window grid */}
          <rect x="33" y="57" width="7" height="7" fill={windowColor} />
          <rect x="43" y="57" width="7" height="7" fill={windowColor} />
          <rect x="33" y="67" width="7" height="7" fill={windowColor} />
          <rect x="43" y="67" width="7" height="7" fill={windowColor} />
        </svg>
      </motion.div>

      <motion.div
        className="overflow-hidden flex items-baseline whitespace-nowrap"
        {...textAnimation}
        style={!animated ? { marginLeft: '6px' } : undefined}
      >
        <span className={`text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>howzy</span>
        <span className="text-xs font-bold text-violet-500 ml-0.5">.in</span>
      </motion.div>
    </div>
  );
}
