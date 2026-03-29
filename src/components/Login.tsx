import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Lock, User, Sparkles, MapPin, Home } from 'lucide-react';
import Logo from './Logo';
import ClientAuthModal from './ClientAuthModal';

interface LoginProps {
  onLogin: (role: 'agent' | 'owner' | 'admin' | 'client', email: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('1234@gmail.com');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-purple-400/20 to-indigo-400/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-indigo-400/20 to-purple-400/20 blur-[120px]" 
        />
      </div>

      {/* Floating Icons */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-[15%] hidden lg:flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-100"
      >
        <Home className="w-8 h-8 text-indigo-500" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 25, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 right-[15%] hidden lg:flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-slate-100"
      >
        <MapPin className="w-10 h-10 text-purple-500" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/3 right-[20%] hidden lg:flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-xl shadow-purple-500/10 border border-slate-100"
      >
        <Sparkles className="w-6 h-6 text-purple-500" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
        className="w-full max-w-[440px] bg-white/70 backdrop-blur-2xl border border-white/50 p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] relative z-10"
      >
        <div className="flex justify-center mb-10 relative">
          <Logo className="h-16" />
        </div>
        
        <div className="text-center mb-10">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 font-medium"
          >
            Enter your credentials to access the dashboard
          </motion.p>
        </div>

        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-6" 
          onSubmit={(e) => { e.preventDefault(); onLogin('agent', email); }}
        >
          <div className="space-y-2 group">
            <label className="text-sm font-bold text-slate-700 ml-1">Email / Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password" 
                className="w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                placeholder="••••••••"
                defaultValue="password"
              />
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => onLogin('agent', email)}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 relative overflow-hidden group"
            >
              <span className="relative z-10">Login as Howzy Partner</span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </motion.button>
            <div className="grid grid-cols-3 gap-3">
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onLogin('owner', email)}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow-md text-xs"
              >
                Howzer
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="w-full bg-white hover:bg-indigo-50 text-indigo-700 font-bold py-3 rounded-xl transition-all border border-indigo-200 shadow-sm hover:shadow-md text-xs"
              >
                Client
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onLogin('admin', email)}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-slate-900/20 text-xs"
              >
                Admin
              </motion.button>
            </div>
          </div>
        </motion.form>
      </motion.div>

      <ClientAuthModal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)} 
        onLogin={(clientEmail) => {
          setIsClientModalOpen(false);
          onLogin('client', clientEmail);
        }} 
      />
    </div>
  );
}
