import React from 'react';
import { motion } from 'motion/react';
import { PlayCircle, ArrowRight, BookOpen } from 'lucide-react';

interface GreetingsProps {
  onContinue: () => void;
  role: 'agent' | 'owner' | 'admin' | 'client';
}

export default function Greetings({ onContinue, role }: GreetingsProps) {
  const getWelcomeMessage = () => {
    switch(role) {
      case 'agent': return 'Welcome back, Howzy Partner!';
      case 'owner': return 'Welcome back, Howzer!';
      case 'admin': return 'Welcome back, Super Admin!';
      case 'client': return 'Welcome to Howzy!';
      default: return 'Welcome back!';
    }
  };
  const tutorials = [
    { title: 'How to register a lead with builders', duration: '5:20' },
    { title: 'Navigating the new Howzy Dashboard', duration: '8:45' },
    { title: 'Uploading 10% advance documents', duration: '3:15' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 p-6 md:p-12 relative overflow-hidden">
      {/* Indian Culture & Buildings Scrolling Watermark */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.04] flex items-end pb-10">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-end h-[40vh] w-[1000px] shrink-0 text-indigo-900">
              <svg viewBox="0 0 1000 300" className="w-full h-full" preserveAspectRatio="none">
                <g fill="currentColor">
                  {/* Taj Mahal inspired */}
                  <path d="M150,300 L150,200 C150,150 250,150 250,200 L250,300 Z" />
                  <circle cx="200" cy="160" r="40" />
                  <rect x="110" y="220" width="20" height="80" />
                  <rect x="270" y="220" width="20" height="80" />
                  <path d="M195,120 L205,120 L200,90 Z" />
                  
                  {/* Modern High-rise */}
                  <rect x="320" y="100" width="60" height="200" />
                  <rect x="330" y="80" width="40" height="20" />
                  <rect x="345" y="50" width="10" height="30" />
                  
                  {/* Temple inspired */}
                  <path d="M450,300 L450,200 L500,80 L550,200 L550,300 Z" />
                  <path d="M495,80 L505,80 L500,40 Z" />
                  
                  {/* Charminar inspired */}
                  <rect x="620" y="180" width="100" height="120" />
                  <rect x="600" y="120" width="30" height="180" />
                  <rect x="710" y="120" width="30" height="180" />
                  <path d="M640,180 C640,140 700,140 700,180 Z" fill="white" />
                  <path d="M610,120 C610,100 620,100 615,80 C610,100 620,100 610,120 Z" />
                  <path d="M720,120 C720,100 730,100 725,80 C720,100 730,100 720,120 Z" />
                  
                  {/* Modern Office Building */}
                  <path d="M800,300 L800,150 L850,120 L900,150 L900,300 Z" />
                  <rect x="820" y="160" width="60" height="140" />
                  
                  {/* Base */}
                  <rect x="0" y="290" width="1000" height="10" />
                </g>
              </svg>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
            {getWelcomeMessage()}
          </h1>
          <p className="text-xl text-slate-600">Ready to close some deals today?</p>
        </motion.div>

        {role === 'agent' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold">Training & Tutorials</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tutorials.map((tut, i) => (
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  key={i} 
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden group cursor-pointer hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all"
                >
                  <div className="aspect-video bg-slate-100 relative flex items-center justify-center">
                    <img 
                      src={`https://picsum.photos/seed/tut${i}/600/400?blur=2`} 
                      alt="Tutorial thumbnail" 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                    <PlayCircle className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-all relative z-10" />
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-white">
                      {tut.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{tut.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-medium transition-all hover:gap-4 shadow-lg shadow-indigo-600/20"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
