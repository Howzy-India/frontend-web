import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import Splash from './components/Splash';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import type { AppRole } from './hooks/useAuth';
import { api } from './services/api';
import { TEST_IDS } from './constants/testIds';

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
  const [showLogoutBanner, setShowLogoutBanner] = useState(false);
  const clientLoginIdRef = React.useRef<string | null>(null);

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

  // When auth state resolves after splash, route appropriately.
  // Do NOT close isLoginOverlayOpen here — ClientAuthModal handles its own close
  // after signup completes. Closing it here races with the async profile check
  // and causes the signup form to never be shown for new users.
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
      case 'sales_agent':
      case 'sourcing_agent':
        return 'pilot_dashboard';
      default:
        return 'client_portal';
    }
  }

  const [clientName, setClientName] = useState<string>('');

  const handleLogin = async (role: AppRole, name: string) => {
    if (role === 'client') {
      setClientName(name);
      const identifier = user?.email ?? user?.phoneNumber ?? name;
      try {
        const result = await api.trackClientLogin({
          email: identifier,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          browser: getBrowserName(navigator.userAgent),
          status: 'Success',
        });
        if (result?.id) clientLoginIdRef.current = result.id;
      } catch {
        // Non-critical — don't block login
      }
    }
    setIsLoginOverlayOpen(false);
    setView(roleToView(role));
  };

  const handleLogout = async () => {
    if (clientLoginIdRef.current) {
      try {
        await api.trackClientLogout(clientLoginIdRef.current);
      } catch {
        // Non-critical — don't block logout
      }
      clientLoginIdRef.current = null;
    }
    await logout();
    setClientName('');
    setIsLoginOverlayOpen(false);
    setView('client_portal');
    setShowLogoutBanner(true);
    setTimeout(() => setShowLogoutBanner(false), 3000);
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    in: { opacity: 1, scale: 1, y: 0 },
    out: { opacity: 0, scale: 1.02, y: -10 },
  };
  const pageTransition: any = { type: 'tween', ease: 'anticipate', duration: 0.4 };

  return (
    <div data-testid={TEST_IDS.APP.CONTAINER} className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 text-slate-900 selection:bg-indigo-500/30 overflow-x-hidden">
      {showLogoutBanner && (
        <div data-testid={TEST_IDS.APP.LOGOUT_BANNER} className="fixed z-[9999] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold
          bottom-6 left-1/2 -translate-x-1/2
          md:bottom-auto md:top-6 md:left-1/2 md:-translate-x-1/2 md:translate-y-0">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Logged out successfully
        </div>
      )}
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
                  uid={user?.uid}
                  onLogout={handleLogout}
                  onLoginClick={() => setIsLoginOverlayOpen(true)}
                  onProfileUpdate={(name) => setClientName(name)}
                  userEmail={user?.email ?? user?.phoneNumber ?? ''}
                  userName={clientName || user?.displayName || ''}
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
