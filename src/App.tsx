import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Splash from './components/Splash';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import type { AppRole } from './hooks/useAuth';
import { api } from './services/api';

const PilotDashboard = lazy(() => import('./components/PilotDashboard'));
const PartnerDashboard = lazy(() => import('./components/PartnerDashboard'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const ClientPortal = lazy(() => import('./components/ClientPortal'));

type ViewState =
  | 'splash'
  | 'pilot_dashboard'
  | 'partner_dashboard'
  | 'super_admin_dashboard'
  | 'client_portal';

function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  return 'Other';
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [view, setView] = useState<ViewState>('splash');
  const [isLoginOverlayOpen, setIsLoginOverlayOpen] = useState(false);
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
      setIsLoginOverlayOpen(false);
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
          browser: getBrowserName(navigator.userAgent),
          status: 'Success',
        });
      } catch {
        // Non-critical — don't block login
      }
    }
    setIsLoginOverlayOpen(false);
    setView(roleToView(role));
  };

  const handleLogout = async () => {
    await logout();
    setIsLoginOverlayOpen(false);
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
          <Suspense fallback={<Splash />}>
            {view === 'splash' && <Splash />}
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
              <>
                <ClientPortal
                  onLogout={handleLogout}
                  onLoginClick={() => setIsLoginOverlayOpen(true)}
                  userEmail={user?.email ?? ''}
                  footerConfig={footerConfig}
                />
                <AnimatePresence>
                  {isLoginOverlayOpen && (
                    <Login
                      onLogin={handleLogin}
                      onClose={() => setIsLoginOverlayOpen(false)}
                      variant="modal"
                    />
                  )}
                </AnimatePresence>
              </>
            )}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
