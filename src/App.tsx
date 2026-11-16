import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useSocket } from './hooks/useSocket';
import { api } from './services/api';
import type { ClientNotification } from './types';
import { Navbar, AppView } from './components/Navbar';
import { Footer } from './components/Footer';
import { NotificationCenter } from './components/NotificationCenter';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { PassengerPortal } from './pages/PassengerPortal';
import { StaffPortal } from './pages/StaffPortal';
import { AdminDashboard } from './pages/AdminDashboard';

function SkytraceShell() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AppView>('landing');
  const [liveSignal, setLiveSignal] = useState(0);
  const [focusBagId, setFocusBagId] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.listNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, liveSignal]);

  // Keep view strictly authorized to the user's role
  useEffect(() => {
    if (loading) return;
    if (!user && (view === 'passenger' || view === 'staff' || view === 'admin')) {
      setView('auth');
    } else if (user && view === 'auth') {
      setView(user.role);
    } else if (
      user &&
      (view === 'passenger' || view === 'staff' || view === 'admin') &&
      view !== user.role
    ) {
      setView(user.role);
    }
  }, [user, loading, view]);

  useSocket({
    userId: user?.id,
    role: user?.role,
    onBaggageScanned: () => setLiveSignal((s) => s + 1),
    onBaggageRegistered: () => setLiveSignal((s) => s + 1),
    onNotification: () => {
      setLiveSignal((s) => s + 1);
    },
  });

  const handleNavigate = (next: AppView, anchor?: string) => {
    if ((next === 'passenger' || next === 'staff' || next === 'admin') && !user) {
      setView('auth');
      return;
    }
    if (user && (next === 'passenger' || next === 'staff' || next === 'admin') && next !== user.role) {
      setView(user.role);
      return;
    }
    setView(next);
    if (anchor) {
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 90);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101B2D] flex items-center justify-center text-xs font-mono tracking-widest text-[#54D6E8]">
        INITIALIZING SKYTRACE AI...
      </div>
    );
  }

  const isPassengerSurface = view === 'passenger';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isPassengerSurface ? 'bg-[#F3F5F7] text-[#101B2D]' : 'bg-[#101B2D] text-[#F3F5F7]'
      }`}
    >
      <Navbar
        view={view}
        onNavigate={handleNavigate}
        unreadCount={unreadCount}
        onOpenNotifications={() => setNotifOpen(true)}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'landing' && <LandingPage onNavigate={handleNavigate} />}
            {view === 'auth' && <AuthPage onNavigate={handleNavigate} />}
            {view === 'passenger' && user?.role === 'passenger' && (
              <PassengerPortal liveSignal={liveSignal} focusBagId={focusBagId} />
            )}
            {view === 'staff' && user?.role === 'staff' && (
              <StaffPortal liveSignal={liveSignal} focusBagId={focusBagId} />
            )}
            {view === 'admin' && user?.role === 'admin' && (
              <AdminDashboard liveSignal={liveSignal} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {view === 'landing' && <Footer onNavigate={handleNavigate} />}

      <NotificationCenter
        open={notifOpen}
        notifications={notifications}
        onClose={() => setNotifOpen(false)}
        onMarkRead={async (id) => {
          await api.markNotificationRead(id);
          await loadNotifications();
        }}
        onMarkAllRead={async () => {
          await api.markAllNotificationsRead();
          await loadNotifications();
        }}
        onSelectBagId={(bagId) => {
          setFocusBagId(bagId);
          if (user) setView(user.role);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SkytraceShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
