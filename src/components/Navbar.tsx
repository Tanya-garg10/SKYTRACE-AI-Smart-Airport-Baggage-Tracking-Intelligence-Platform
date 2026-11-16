import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AppView = 'landing' | 'auth' | 'passenger' | 'staff' | 'admin';

export function Navbar({
  view,
  onNavigate,
  unreadCount,
  onOpenNotifications,
}: {
  view: AppView;
  onNavigate: (next: AppView, anchor?: string) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
}) {
  const { user, logout } = useAuth();

  // Strict 3-Zone Top Bar Contract for Public Landing & Auth
  if (view === 'landing' || view === 'auth') {
    const primaryLabel = user
      ? user.role === 'admin'
        ? 'Admin Command'
        : user.role === 'staff'
        ? 'Control Station'
        : 'Concierge Portal'
      : 'Sign In';

    const handlePrimary = () => {
      if (user) {
        onNavigate(user.role);
      } else {
        onNavigate('auth');
      }
    };

    return (
      <header className="sticky top-0 z-40 border-b border-[#A8B6C7]/15 bg-[#101B2D]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="font-display text-lg font-bold tracking-tight text-[#F3F5F7] whitespace-nowrap shrink-0 cursor-pointer"
          >
            SKYTRACE <span className="text-[#C9A96E]">AI</span>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A8B6C7]">
            <button
              type="button"
              onClick={() => onNavigate('landing', 'chapter-problem')}
              className="hover:text-[#F3F5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              The Problem
            </button>
            <button
              type="button"
              onClick={() => onNavigate('landing', 'chapter-checkpoints')}
              className="hover:text-[#F3F5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Checkpoints
            </button>
            <button
              type="button"
              onClick={() => onNavigate('landing', 'chapter-intelligence')}
              className="hover:text-[#F3F5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Intelligence
            </button>
            <button
              type="button"
              onClick={() => onNavigate('landing', 'chapter-perspectives')}
              className="hover:text-[#F3F5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Experiences
            </button>
            <button
              type="button"
              onClick={() => onNavigate('landing', 'chapter-tracking')}
              className="hover:text-[#54D6E8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Track Bag
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handlePrimary}
              className="px-4 py-2 rounded-lg bg-ma-aurora text-[#101B2D] text-xs font-bold hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Passenger Cloud White Header vs. Staff/Admin Midnight Navy Header
  const isPassenger = view === 'passenger';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md ${
        isPassenger
          ? 'border-[#101B2D]/10 bg-white/95 text-[#101B2D]'
          : 'border-[#A8B6C7]/15 bg-[#101B2D]/95 text-[#F3F5F7]'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
          >
            SKYTRACE <span className={isPassenger ? 'text-[#9E7B3B]' : 'text-[#C9A96E]'}>AI</span>
          </button>
          <span
            className={isPassenger ? 'text-[#101B2D]/20' : 'text-[#A8B6C7]/30'}
            aria-hidden="true"
          >
            /
          </span>
          <span
            className={`text-xs sm:text-sm font-medium truncate ${
              isPassenger ? 'text-[#203650]' : 'text-[#54D6E8]'
            }`}
          >
            {view === 'passenger'
              ? 'Travel Concierge'
              : view === 'staff'
              ? 'Baggage Control Station'
              : 'Airport Digital Twin Command'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenNotifications}
            className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
              isPassenger
                ? 'border-[#101B2D]/15 text-[#101B2D] hover:bg-[#F3F5F7]'
                : 'border-[#A8B6C7]/20 text-[#F3F5F7] hover:bg-[#203650]'
            }`}
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#54D6E8] text-[#101B2D] text-[10px] font-mono font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden sm:flex flex-col items-end text-right px-1">
            <span className="text-xs font-semibold whitespace-nowrap">{user?.fullName}</span>
            <span
              className={`text-[11px] capitalize ${
                isPassenger ? 'text-[#203650]/75' : 'text-[#A8B6C7]'
              }`}
            >
              {user?.role}
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              onNavigate('landing');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isPassenger
                ? 'border-[#101B2D]/15 text-[#101B2D] hover:bg-[#F3F5F7]'
                : 'border-[#A8B6C7]/20 text-[#F3F5F7] hover:bg-[#203650]'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
