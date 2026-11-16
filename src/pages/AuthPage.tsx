import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, KeyRound, Shield, UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { AppView } from '../components/Navbar';

const DEMO_ACCOUNTS = [
  {
    label: 'Passenger Demo',
    name: 'Elena Rostova',
    email: 'passenger@skytrace.aero',
    pass: 'SkyPass2026!',
    role: 'Luxury Travel Concierge',
    accent: 'text-[#52C7A5]',
  },
  {
    label: 'Airport Staff Demo',
    name: 'Marcus Vance',
    email: 'staff@skytrace.aero',
    pass: 'SkyStaff2026!',
    role: 'Baggage Control Station',
    accent: 'text-[#54D6E8]',
  },
  {
    label: 'Admin Demo',
    name: 'Dr. Aris Thorne',
    email: 'admin@skytrace.aero',
    pass: 'SkyAdmin2026!',
    role: 'Airport Digital Twin Command',
    accent: 'text-[#C9A96E]',
  },
];

export function AuthPage({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user =
        mode === 'login'
          ? await login(email, password)
          : await register({ fullName, email, password, phone });
      onNavigate(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setSubmitting(true);
    try {
      const user = await login(demoEmail, demoPass);
      onNavigate(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#101B2D] text-[#F3F5F7] aviation-noise flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left: Sign-In / Registration Panel */}
        <div className="lg:col-span-7 rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/55 backdrop-blur-md overflow-hidden">
          <div className="h-[2px] bg-ma-gold opacity-75" />
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A8B6C7] hover:text-[#F3F5F7] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Airport Overview
              </button>

              <div className="inline-flex rounded-lg p-1 bg-[#101B2D] border border-[#A8B6C7]/15">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#203650] text-[#54D6E8] border border-[#54D6E8]/35'
                      : 'text-[#A8B6C7] hover:text-[#F3F5F7]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#203650] text-[#54D6E8] border border-[#54D6E8]/35'
                      : 'text-[#A8B6C7] hover:text-[#F3F5F7]'
                  }`}
                >
                  Passenger Sign Up
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono tracking-[0.18em] text-[#C9A96E]">
                ROLE-BASED ACCESS GATEWAY
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3F5F7]">
                {mode === 'login' ? 'Sign in to SKYTRACE AI' : 'Create Passenger Concierge Account'}
              </h1>
              <p className="text-xs sm:text-sm text-[#A8B6C7]">
                {mode === 'login'
                  ? 'Enter your credentials or select an evaluation account to enter your dedicated portal.'
                  : 'Register as a passenger to follow checked baggage across every checkpoint and submit support claims.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A8B6C7] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8B6C7]/25 bg-[#101B2D] text-sm text-[#F3F5F7] focus:outline-none focus:ring-2 focus:ring-[#54D6E8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A8B6C7] mb-1.5">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8B6C7]/25 bg-[#101B2D] text-sm text-[#F3F5F7] focus:outline-none focus:ring-2 focus:ring-[#54D6E8]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#A8B6C7] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@skytrace.aero"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8B6C7]/25 bg-[#101B2D] text-sm text-[#F3F5F7] focus:outline-none focus:ring-2 focus:ring-[#54D6E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8B6C7] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8B6C7]/25 bg-[#101B2D] text-sm text-[#F3F5F7] focus:outline-none focus:ring-2 focus:ring-[#54D6E8]"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[#E87583]/10 border border-[#E87583]/40 text-xs text-[#E87583]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-ma-aurora disabled:opacity-60 text-[#101B2D] text-xs font-bold tracking-wider hover:opacity-95 transition-opacity cursor-pointer"
              >
                {mode === 'login' ? (
                  <KeyRound className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {submitting
                  ? 'AUTHENTICATING...'
                  : mode === 'login'
                  ? 'SIGN IN TO PORTAL'
                  : 'CREATE PASSENGER ACCOUNT'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Quick Demo Credentials */}
        <div className="lg:col-span-5 rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/45 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F5F7]">
            <Shield className="w-4 h-4 text-[#C9A96E]" />
            <span>Instant Role Evaluation</span>
          </div>
          <p className="text-xs text-[#A8B6C7] leading-relaxed">
            Launch any role experience directly with seeded aviation records. Authorization is enforced server-side per account role.
          </p>

          <div className="space-y-3">
            {DEMO_ACCOUNTS.map((acc) => (
              <div
                key={acc.email}
                className="rounded-xl border border-[#A8B6C7]/15 bg-[#101B2D]/85 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#F3F5F7]">{acc.label}</span>
                  <span className={`text-[11px] font-mono ${acc.accent}`}>{acc.role}</span>
                </div>
                <div className="text-[11px] font-mono text-[#A8B6C7] space-y-0.5">
                  <div>Email: {acc.email}</div>
                  <div>Pass: {acc.pass}</div>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleQuickDemo(acc.email, acc.pass)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#A8B6C7]/25 hover:border-[#54D6E8] text-xs font-semibold text-[#F3F5F7] hover:text-[#54D6E8] transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Enter as {acc.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
