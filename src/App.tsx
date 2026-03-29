import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Splash from './components/Splash';
import Login from './components/Login';
import Greetings from './components/Greetings';
import PilotDashboard from './components/PilotDashboard';
import PartnerDashboard from './components/PartnerDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ClientPortal from './components/ClientPortal';
import { useAuth } from './hooks/useAuth';
import type { AppRole } from './hooks/useAuth';
import { api } from './services/api';

type ViewState =
  | 'splash'
  | 'login'
  | 'greetings'
  | 'pilot_dashboard'
  | 'partner_dashboard'
  | 'super_admin_dashboard'
  | 'client_portal';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [view, setView] = useState<ViewState>('splash');
  const [footerConfig, setFooterConfig] = useState<any>(null);

  // Show splash on first load, then route based on auth state
  useEffect(() => {
    if (view === 'splash') {
      const timer = setTimeout(() => {
        if (!authLoading) {
          setView(user ? roleToView(user.role) : 'client_portal');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view, authLoading, user]);

  // When auth state resolves after splash, route appropriately
  useEffect(() => {
    if (view === 'splash' || authLoading) return;
    if (user) {
      setView(roleToView(user.role));
    }
  }, [user, authLoading]);

  function roleToView(role: AppRole): ViewState {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return 'super_admin_dashboard';
      case 'agent':
        return 'pilot_dashboard';
      case 'partner':
        return 'partner_dashboard';
      default:
        return 'client_portal';
    }
  }

  const handleLogin = async (role: AppRole, email: string) => {
    if (role === 'client') {
      try {
        await api.trackClientLogin({
          email,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          browser: navigator.userAgent.includes('Chrome')
            ? 'Chrome'
            : navigator.userAgent.includes('Firefox')
            ? 'Firefox'
            : navigator.userAgent.includes('Safari')
            ? 'Safari'
            : 'Other',
          status: 'Success',
        });
      } catch {
        // Non-critical — don't block login
      }
    }
    setView('greetings');
  };

  const handleContinue = () => {
    if (!user) return;
    setView(roleToView(user.role));
  };

  const handleLogout = async () => {
    await logout();
    setView('client_portal');
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    in: { opacity: 1, scale: 1, y: 0 },
    out: { opacity: 0, scale: 1.02, y: -10 },
  };
  const pageTransition: any = { type: 'tween', ease: 'anticipate', duration: 0.4 };

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
          {view === 'greetings' && user && (
            <Greetings onContinue={handleContinue} role={mapRoleForGreeting(user.role)} />
          )}
          {view === 'pilot_dashboard' && (
            <PilotDashboard onLogout={handleLogout} />
          )}
          {view === 'partner_dashboard' && (
            <PartnerDashboard onLogout={handleLogout} userEmail={user?.email ?? ''} />
          )}
          {view === 'super_admin_dashboard' && (
            <SuperAdminDashboard
              onLogout={handleLogout}
              footerConfig={footerConfig}
              onFooterConfigChange={setFooterConfig}
            />
          )}
          {view === 'client_portal' && (
            <ClientPortal
              onLogout={handleLogout}
              onLoginClick={() => setView('login')}
              userEmail={user?.email ?? ''}
              footerConfig={footerConfig}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function mapRoleForGreeting(role: AppRole): 'agent' | 'owner' | 'admin' | 'client' {
  if (role === 'super_admin' || role === 'admin') return 'admin';
  if (role === 'agent') return 'agent';
  if (role === 'partner') return 'owner';
  return 'client';
}
