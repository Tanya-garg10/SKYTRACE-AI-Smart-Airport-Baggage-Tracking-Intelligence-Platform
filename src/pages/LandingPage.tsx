import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Luggage,
  Plane,
  QrCode,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import type { DemoSampleRecord, PublicStats } from '../types';
import { CinematicHero } from '../components/CinematicHero';
import { AirportNetworkVisualization } from '../components/AirportNetworkVisualization';
import { BaggageJourneyTimeline } from '../components/BaggageJourneyTimeline';
import { BaggageSearchExperience } from '../components/BaggageSearchExperience';
import { StatusIndicator } from '../components/StatusIndicator';
import type { AppView } from '../components/Navbar';

const PROBLEM_IMG = '/src/assets/images/misplaced_luggage_chapter_1794812872263.jpg';
const CONVEYOR_IMG = '/src/assets/images/baggage_conveyor_tech_1794810457196.jpg';
const LUGGAGE_IMG = '/src/assets/images/smart_luggage_tag_1794810456394.jpg';

const PERSPECTIVES = [
  {
    id: 'passenger' as const,
    role: 'Passenger Experience',
    title: 'Luxury Travel Concierge',
    themeNote: 'Cloud White Editorial Surface',
    summary:
      'A calm, reassuring flight-ticket boarding pass workspace with our Follow My Bag animated route, instant QR tag lookup, and effortless claim support.',
    highlights: [
      'Digital boarding pass with live flight & carousel corridor',
      'Interactive horizontal suitcase journey across 8 checkpoints',
      'Instant missing or damaged baggage filing & status tracking',
    ],
  },
  {
    id: 'staff' as const,
    role: 'Airport Ground Staff',
    title: 'Baggage Control Station',
    themeNote: 'Midnight Navy & Slate Operations',
    summary:
      'Built for speed on the ramp and at sorting diverters. Full-stage optical QR Scan Station with camera reticle, manual fallback, and RFID simulation.',
    highlights: [
      'Dedicated Scan Station showing Previous, Current & Next checkpoint',
      'One-click baggage tag registration & printable PNG QR cards',
      'Real-time flight queue, amber delay warnings, and incident handling',
    ],
  },
  {
    id: 'admin' as const,
    role: 'Airport Administrator',
    title: 'The Airport Digital Twin',
    themeNote: 'Midnight Aurora Command Center',
    summary:
      'Interactive schematic of every departure, airside, and arrival zone paired with a visual AI Risk Spectrum and live operational analytics.',
    highlights: [
      'Clickable Digital Twin checkpoints showing processed & delayed bags',
      'AI Risk Spectrum & Anomaly Detection grounded in real events',
      'Flight control, staff provisioning, audit feed, and CSV export',
    ],
  },
];

export function LandingPage({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [demoSamples, setDemoSamples] = useState<DemoSampleRecord[]>([]);
  const [activeDemo, setActiveDemo] = useState<DemoSampleRecord | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [activePerspective, setActivePerspective] = useState<'passenger' | 'staff' | 'admin'>(
    'passenger'
  );
  const [transformStep, setTransformStep] = useState(2);

  useEffect(() => {
    api
      .getPublicStats()
      .then((res) => setStats(res.stats))
      .catch(() => {});

    api
      .getDemoSamples()
      .then((res) => {
        setDemoSamples(res.samples);
        if (res.samples.length > 0) setActiveDemo(res.samples[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransformStep((prev) => (prev + 1) % 4);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const handleDemoSearch = async (bagId: string) => {
    setDemoLoading(true);
    setDemoError('');
    try {
      const res = await api.trackDemoSample(bagId);
      setActiveDemo(res.record);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Sample Bag ID not found.');
    } finally {
      setDemoLoading(false);
    }
  };

  const selectedPersp =
    PERSPECTIVES.find((p) => p.id === activePerspective) ?? PERSPECTIVES[0];

  return (
    <div className="bg-[#101B2D] text-[#F3F5F7]">
      {/* Opening Scene: Hero */}
      <CinematicHero
        stats={stats}
        onTrackClick={() =>
          document.getElementById('chapter-tracking')?.scrollIntoView({ behavior: 'smooth' })
        }
        onExploreClick={() =>
          document.getElementById('chapter-problem')?.scrollIntoView({ behavior: 'smooth' })
        }
      />

      {/* Chapter 01 — The Problem (Cloud White Luxury Surface) */}
      <section
        id="chapter-problem"
        className="bg-[#F3F5F7] text-[#101B2D] border-b border-[#101B2D]/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-5 space-y-6"
            >
              <div className="text-xs font-mono tracking-[0.2em] text-[#9E7B3B] font-semibold">
                CHAPTER 01 · THE PROBLEM
              </div>
              <h2
                className="font-display font-bold tracking-tight text-[#101B2D] leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3rem)', textWrap: 'balance' }}
              >
                Silent carousels. Fragmented scans. Zero clarity.
              </h2>
              <p className="text-base text-[#203650]/85 leading-relaxed">
                When a suitcase misses a tight connection or stalls behind a sorting diverter, passengers wait at empty carousels while ramp teams search disconnected spreadsheets.
              </p>
              <div className="pt-2 space-y-3 border-t border-[#101B2D]/12 text-sm text-[#203650]">
                <div>01. Disconnected handoffs between security, sorting, and apron teams.</div>
                <div>02. Late discovery of missed transfers after the aircraft has departed.</div>
                <div>03. Stressful manual paper claims when baggage goes missing.</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7"
            >
              <div className="rounded-2xl overflow-hidden border border-[#101B2D]/15 bg-[#101B2D] relative">
                <img
                  src={PROBLEM_IMG}
                  alt="Unattended suitcase beside an empty airport baggage carousel at night"
                  referrerPolicy="no-referrer"
                  className="w-full h-[360px] sm:h-[430px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101B2D]/85 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-2 text-[#F3F5F7] text-xs">
                  <span className="font-mono text-[#F0B85B]">UNTRACKED TRANSFER GAP</span>
                  <span className="text-[#A8B6C7]">Carousel 4 · 00:42 Local Time</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Chapter 02 — The Transformation */}
      <section className="bg-[#101B2D] text-[#F3F5F7] border-b border-[#A8B6C7]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-24 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-mono tracking-[0.2em] text-[#C9A96E]">
                CHAPTER 02 · THE TRANSFORMATION
              </div>
              <h2
                className="font-display font-bold tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3rem)', textWrap: 'balance' }}
              >
                One digital luggage identity across every terminal gate.
              </h2>
            </div>
            <p className="lg:col-span-5 text-sm text-[#A8B6C7] leading-relaxed">
              Every checked bag receives a persistent digital identity uniting QR visual verification and RFID-ready EPC telemetry from origin counter to final exit gate.
            </p>
          </div>

          <div className="rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/45 p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'QR + RFID Tag Issued', zone: 'Check-in Counter', Icon: QrCode },
                { label: 'Optical & Gate Clearance', zone: 'Security & Sorter', Icon: Radio },
                { label: 'Ramp & Hold Verified', zone: 'Aircraft Loading', Icon: Plane },
                { label: 'Carousel Arrival Alert', zone: 'Reclaim Verification', Icon: Luggage },
              ].map((item, idx) => {
                const active = idx === transformStep;
                const Icon = item.Icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTransformStep(idx)}
                    className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                      active
                        ? 'border-[#54D6E8] bg-[#101B2D]'
                        : 'border-[#A8B6C7]/15 bg-[#101B2D]/45 hover:border-[#A8B6C7]/35'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon
                        className={`w-4 h-4 ${active ? 'text-[#54D6E8]' : 'text-[#A8B6C7]'}`}
                      />
                      <span className="font-mono text-[11px] text-[#C9A96E]">0{idx + 1}</span>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#F3F5F7]">{item.label}</div>
                    <div className="mt-0.5 text-xs text-[#A8B6C7]">{item.zone}</div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 rounded-xl overflow-hidden border border-[#A8B6C7]/15">
                <img
                  src={CONVEYOR_IMG}
                  alt="Automated airport baggage conveyor with overhead optical scanner gates"
                  referrerPolicy="no-referrer"
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#A8B6C7]/15">
                <img
                  src={LUGGAGE_IMG}
                  alt="Matte navy suitcase fitted with crisp QR aviation baggage tag"
                  referrerPolicy="no-referrer"
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 03 — Every Checkpoint Matters */}
      <section
        id="chapter-checkpoints"
        className="bg-[#101B2D] text-[#F3F5F7] border-b border-[#A8B6C7]/15"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-24 space-y-10">
          <div className="max-w-2xl space-y-4">
            <div className="text-xs font-mono tracking-[0.2em] text-[#54D6E8]">
              CHAPTER 03 · EVERY CHECKPOINT MATTERS
            </div>
            <h2
              className="font-display font-bold tracking-tight leading-[1.08]"
              style={{ fontSize: 'clamp(2rem, 3.6vw, 3rem)', textWrap: 'balance' }}
            >
              Eight illuminated milestones. Zero blind spots.
            </h2>
            <p className="text-sm text-[#A8B6C7] leading-relaxed">
              Click any checkpoint below to inspect how SKYTRACE AI structures custody across international corridors.
            </p>
          </div>

          {activeDemo && (
            <BaggageJourneyTimeline
              events={activeDemo.events}
              bagStatus={activeDemo.status}
              variant="dark"
            />
          )}

          <AirportNetworkVisualization />
        </div>
      </section>

      {/* Chapter 04 — Intelligence in Motion */}
      <section
        id="chapter-intelligence"
        className="bg-[#203650]/45 text-[#F3F5F7] border-b border-[#A8B6C7]/15"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-24 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-5">
              <div className="text-xs font-mono tracking-[0.2em] text-[#C9A96E]">
                CHAPTER 04 · INTELLIGENCE IN MOTION
              </div>
              <h2
                className="font-display font-bold tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3rem)', textWrap: 'balance' }}
              >
                AI that flags transfer risk before the gate closes.
              </h2>
              <p className="text-sm text-[#A8B6C7] leading-relaxed">
                Instead of waiting for a missed-bag claim at the destination, SKYTRACE AI scores dwell time, departure proximity, skipped security steps, and duplicate diverter scans using live telemetry.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-[#E87583]/40 bg-[#101B2D] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#E87583]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>HIGH DELAY RISK · SAMPLE EVIDENCE</span>
                  </div>
                  <span className="font-mono text-xs text-[#C9A96E]">Score 89/100</span>
                </div>
                <div className="text-sm font-semibold text-[#F3F5F7]">
                  Bag ST-2026-4811 stalled 82m at Sorting Loop A while SK-402 boards in 40m
                </div>
                <p className="text-xs text-[#A8B6C7]">
                  Recommended Staff Action: Dispatch ground runner to Diverter 3 for direct cart transfer to Gate T4-B22.
                </p>
              </div>

              <div className="rounded-2xl border border-[#F0B85B]/40 bg-[#101B2D] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#F0B85B]">
                    <ShieldAlert className="w-4 h-4" />
                    <span>CHECKPOINT ANOMALY DETECTED</span>
                  </div>
                  <span className="font-mono text-xs text-[#54D6E8]">SKIPPED_CHECKPOINT</span>
                </div>
                <div className="text-sm font-semibold text-[#F3F5F7]">
                  Bag ST-2026-4814 recorded at Sorting Area without prior Security Screening scan
                </div>
                <p className="text-xs text-[#A8B6C7]">
                  Grounded rule engine automatically flags missing intermediate scans and duplicate reads for audit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 05 — Three Perspectives (Cloud White Editorial Surface) */}
      <section
        id="chapter-perspectives"
        className="bg-[#F3F5F7] text-[#101B2D] border-b border-[#101B2D]/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-24 space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-mono tracking-[0.2em] text-[#9E7B3B] font-semibold">
                CHAPTER 05 · THREE PERSPECTIVES
              </div>
              <h2
                className="font-display font-bold tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3rem)', textWrap: 'balance' }}
              >
                Tailored interfaces for every airport role.
              </h2>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-[#E4E9EF] border border-[#101B2D]/10">
              {PERSPECTIVES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePerspective(p.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activePerspective === p.id
                      ? 'bg-[#101B2D] text-[#F3F5F7]'
                      : 'text-[#203650]/75 hover:text-[#101B2D]'
                  }`}
                >
                  {p.id === 'passenger'
                    ? 'Passenger'
                    : p.id === 'staff'
                    ? 'Ground Staff'
                    : 'Administrator'}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            key={selectedPersp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-[#101B2D]/12 bg-white overflow-hidden"
          >
            <div className="h-[2px] bg-ma-gold opacity-85" />
            <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="text-xs font-mono text-[#157A8C] font-semibold">
                  {selectedPersp.role} · {selectedPersp.themeNote}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#101B2D]">
                  {selectedPersp.title}
                </h3>
                <p className="text-sm sm:text-base text-[#203650]/85 leading-relaxed">
                  {selectedPersp.summary}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('auth')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ma-aurora text-[#101B2D] text-xs font-bold tracking-wider cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    OPEN {selectedPersp.id.toUpperCase()} PORTAL
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-[#101B2D]/10 bg-[#F3F5F7] p-6 space-y-3 text-sm text-[#101B2D]">
                {selectedPersp.highlights.map((h, i) => (
                  <div
                    key={h}
                    className="py-2.5 border-b border-[#101B2D]/10 last:border-0 flex items-start gap-3"
                  >
                    <span className="font-mono text-xs text-[#9E7B3B] font-bold mt-0.5">
                      0{i + 1}
                    </span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chapter 06 — Start Tracking */}
      <section id="chapter-tracking" className="bg-[#101B2D] text-[#F3F5F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-24 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-mono tracking-[0.2em] text-[#54D6E8]">
                CHAPTER 06 · START TRACKING
              </div>
              <h2
                className="font-display font-bold tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 3.6vw, 3rem)', textWrap: 'balance' }}
              >
                Experience Follow My Bag right now.
              </h2>
              <p className="text-sm text-[#A8B6C7]">
                Search one of our isolated demonstration IDs below or sign in to view live passenger and operational records.
              </p>
            </div>
            <span className="text-xs font-mono text-[#C9A96E]">
              Demonstration Sample Data · Separate from Live DB
            </span>
          </div>

          <BaggageSearchExperience
            initialQuery={activeDemo?.bagId ?? 'DEMO-BAG-901'}
            loading={demoLoading}
            error={demoError}
            suggestions={demoSamples.map((s) => s.bagId)}
            onSearch={handleDemoSearch}
            variant="dark"
          />

          {activeDemo && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/55 p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-bold text-[#F3F5F7]">
                      {activeDemo.bagId}
                    </span>
                    <StatusIndicator status={activeDemo.status} />
                  </div>
                  <div className="text-xs text-[#A8B6C7]">
                    {activeDemo.flightNumber} ({activeDemo.departureAirport} →{' '}
                    {activeDemo.arrivalAirport}) · {activeDemo.color} {activeDemo.baggageType} ·{' '}
                    {activeDemo.currentLocation}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-ma-aurora text-[#101B2D] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
                >
                  Sign In for Full Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <BaggageJourneyTimeline
                events={activeDemo.events}
                bagStatus={activeDemo.status}
                variant="dark"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
