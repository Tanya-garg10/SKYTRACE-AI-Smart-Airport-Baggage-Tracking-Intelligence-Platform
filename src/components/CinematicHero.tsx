import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass, Luggage, Plane } from 'lucide-react';
import type { PublicStats } from '../types';
import { AnimatedCounter } from './AnimatedCounter';

const HERO_IMG = '/src/assets/images/hero_airport_terminal_1794810455688.jpg';

export function CinematicHero({
  stats,
  onTrackClick,
  onExploreClick,
}: {
  stats: PublicStats | null;
  onTrackClick: () => void;
  onExploreClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-[#101B2D] text-[#F3F5F7] border-b border-[#A8B6C7]/15">
      {/* Background Airport Visual + Controlled Midnight Aurora Gradient Scrim */}
      <div className="absolute inset-0 pointer-events-none">
        {!imgErr ? (
          <img
            src={HERO_IMG}
            alt="Illuminated international airport terminal concourse at night"
            referrerPolicy="no-referrer"
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-ma-hero opacity-80" />
        )}
        <div
          className="absolute inset-0 opacity-85"
          style={{
            background:
              'linear-gradient(120deg, rgba(16,27,45,0.95) 0%, rgba(32,54,80,0.82) 55%, rgba(40,127,155,0.45) 100%)',
          }}
        />
        {/* Subtle Cyan Aurora Horizon Band */}
        <div
          className="absolute -top-24 right-[-10%] w-[680px] h-[420px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'linear-gradient(120deg, #54D6E8, #78E6D8)' }}
        />
        <div className="absolute inset-0 aviation-noise opacity-50" />
      </div>

      {/* Subtle Illuminated Baggage Path Overlay */}
      <svg
        viewBox="0 0 1440 420"
        className="absolute inset-x-0 bottom-24 w-full h-auto pointer-events-none opacity-45"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="auroraPath" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#54D6E8" stopOpacity="0" />
            <stop offset="50%" stopColor="#54D6E8" stopOpacity="0.85" />
            <stop offset="80%" stopColor="#C9A96E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#54D6E8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -60 320 C 260 320, 320 180, 620 210 C 900 240, 1080 120, 1500 170"
          fill="none"
          stroke="url(#auroraPath)"
          strokeWidth="2"
        />
        <motion.circle
          r="4.5"
          fill="#54D6E8"
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: '100%' }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            offsetPath:
              'path("M -60 320 C 260 320, 320 180, 620 210 C 900 240, 1080 120, 1500 170")',
          }}
        />
      </svg>

      {/* Main Hero Grid */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-16 pb-10 lg:pt-24 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Editorial Statement */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-ma-gold" />
              <span className="text-xs font-mono tracking-[0.22em] text-[#C9A96E]">
                MIDNIGHT AURORA AVIATION INTELLIGENCE
              </span>
            </div>

            <h1
              className="font-display font-bold tracking-tight text-[#F3F5F7] leading-[1.04]"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.35rem)', textWrap: 'balance' }}
            >
              YOUR BAGGAGE.
              <br />
              NEVER OUT OF SIGHT.
            </h1>

            <p className="text-base sm:text-lg text-[#A8B6C7] max-w-xl leading-relaxed">
              Intelligent baggage tracking. Real-time journey visibility. A calm, unified aviation platform connecting passengers, ground operations, and airport command centers.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onTrackClick}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-ma-aurora text-[#101B2D] text-xs font-bold tracking-wider hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
              >
                TRACK YOUR BAG
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onExploreClick}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg border border-[#A8B6C7]/30 hover:border-[#54D6E8] bg-[#203650]/55 text-[#F3F5F7] text-xs font-semibold tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4 text-[#54D6E8]" />
                EXPLORE THE PLATFORM
              </motion.button>
            </div>
          </motion.div>

          {/* Right Floating Airport Telemetry Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl border border-[#A8B6C7]/20 bg-[#101B2D]/85 backdrop-blur-md overflow-hidden">
              <div className="h-[2px] bg-ma-gold opacity-80" />
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#A8B6C7]/15 pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#54D6E8]">
                    <Plane className="w-4 h-4" />
                    <span>CONCOURSE CORRIDORS</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#C9A96E]">DEMO TELEMETRY</span>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { bag: 'DEMO-BAG-901', route: 'JFK → LHR', stage: 'Aircraft Hold 2', status: 'Loaded' },
                    { bag: 'DEMO-BAG-902', route: 'LHR → SIN', stage: 'Carousel C-07', status: 'Arrived' },
                    { bag: 'DEMO-BAG-903', route: 'DXB → FRA', stage: 'Sorter Loop B', status: 'Transfer Hold' },
                  ].map((row) => (
                    <div
                      key={row.bag}
                      className="flex items-center justify-between py-2.5 border-b border-[#A8B6C7]/10 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Luggage className="w-4 h-4 text-[#54D6E8] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-mono font-semibold text-[#F3F5F7]">{row.bag}</div>
                          <div className="text-[#A8B6C7] truncate">
                            {row.route} · {row.stage}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[#52C7A5] shrink-0">
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-[#A8B6C7] pt-1">
                  Preview corridors display isolated sample IDs. Sign in for live passenger and ramp records.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Live Operational Strip */}
      <div className="relative z-10 border-t border-[#A8B6C7]/15 bg-[#101B2D]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-[#A8B6C7]">Active Baggage Journeys</div>
            <div className="mt-1 text-2xl font-bold text-[#F3F5F7]">
              <AnimatedCounter value={stats?.totalBaggageTracked} />
            </div>
          </div>
          <div>
            <div className="text-xs text-[#A8B6C7]">Flights Monitored</div>
            <div className="mt-1 text-2xl font-bold text-[#54D6E8]">
              <AnimatedCounter value={stats?.activeFlights} />
            </div>
          </div>
          <div>
            <div className="text-xs text-[#A8B6C7]">Successful Deliveries</div>
            <div className="mt-1 text-2xl font-bold text-[#52C7A5]">
              <AnimatedCounter value={stats?.deliveredBaggage} />
            </div>
          </div>
          <div>
            <div className="text-xs text-[#A8B6C7]">Airport Checkpoints</div>
            <div className="mt-1 text-2xl font-bold text-[#C9A96E]">
              <AnimatedCounter value={stats?.activeCheckpoints} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
