import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Splash from './components/Splash';
import Login from './components/Login';
import Greetings from './components/Greetings';
import PilotDashboard from './components/PilotDashboard';
import PartnerDashboard from './components/PartnerDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ClientPortal from './components/ClientPortal';
import { api } from './services/api';

type ViewState = 'splash' | 'login' | 'greetings' | 'pilot_dashboard' | 'partner_dashboard' | 'super_admin_dashboard' | 'client_portal';
type Role = 'agent' | 'owner' | 'admin' | 'client' | null;

export default function App() {
  const [view, setView] = useState<ViewState>('splash');
  const [role, setRole] = useState<Role>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [footerConfig, setFooterConfig] = useState<any>(null);

  useEffect(() => {
    if (view === 'splash') {
      const timer = setTimeout(() => {
        setView('client_portal');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  const handleLogin = async (selectedRole: 'agent' | 'owner' | 'admin' | 'client', email: string) => {
    setRole(selectedRole);
    setUserEmail(email);
    setView('greetings');

    if (selectedRole === 'client') {
      try {
        await api.trackClientLogin({
          email,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
          status: 'Success'
        });
      } catch (error) {
        console.error('Failed to track login:', error);
      }
    }
  };

  const handleContinue = () => {
    if (role === 'agent') {
      setView('pilot_dashboard');
    } else if (role === 'admin') {
      setView('super_admin_dashboard');
    } else if (role === 'owner') {
      setView('partner_dashboard');
    } else if (role === 'client') {
      setView('client_portal');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setUserEmail('');
    setView('client_portal');
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    in: { opacity: 1, scale: 1, y: 0 },
    out: { opacity: 0, scale: 1.02, y: -10 }
  };

  const pageTransition: any = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 text-slate-900 selection:bg-indigo-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="min-h-screen w-full"
        >
          {view === 'splash' && <Splash />}
          {view === 'login' && <Login onLogin={handleLogin} />}
          {view === 'greetings' && role && <Greetings onContinue={handleContinue} role={role} />}
          {view === 'pilot_dashboard' && <PilotDashboard onLogout={handleLogout} />}
          {view === 'partner_dashboard' && <PartnerDashboard onLogout={handleLogout} userEmail={userEmail} />}
          {view === 'super_admin_dashboard' && <SuperAdminDashboard onLogout={handleLogout} footerConfig={footerConfig} onFooterConfigChange={setFooterConfig} />}
          {view === 'client_portal' && <ClientPortal onLogout={handleLogout} onLoginClick={() => setView('login')} userEmail={userEmail} footerConfig={footerConfig} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
