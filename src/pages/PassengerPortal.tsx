import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Luggage,
  Plane,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type {
  BaggageRecord,
  FlightRecord,
  LostBaggageReportRecord,
  TrackingEventRecord,
} from '../types';
import { DigitalBoardingPass } from '../components/DigitalBoardingPass';
import { BaggageSearchExperience } from '../components/BaggageSearchExperience';
import { BaggageJourneyTimeline } from '../components/BaggageJourneyTimeline';
import { BaggageIdentityCard } from '../components/BaggageIdentityCard';
import { StatusIndicator } from '../components/StatusIndicator';
import { QrCardModal } from '../components/QrCardModal';

export function PassengerPortal({
  liveSignal,
  focusBagId,
}: {
  liveSignal: number;
  focusBagId?: string | null;
}) {
  const { user } = useAuth();
  const [bags, setBags] = useState<BaggageRecord[]>([]);
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [reports, setReports] = useState<LostBaggageReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<{
    baggage: BaggageRecord;
    flight: FlightRecord | null;
    events: TrackingEventRecord[];
    qrDataUrl: string;
  } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'tracking' | 'reports'>('tracking');

  // Missing / Damaged report form
  const [repBagId, setRepBagId] = useState('');
  const [repFlight, setRepFlight] = useState('');
  const [repDesc, setRepDesc] = useState('');
  const [repColor, setRepColor] = useState('');
  const [repType, setRepType] = useState('Hardshell');
  const [repLocation, setRepLocation] = useState('');
  const [repCategory, setRepCategory] =
    useState<LostBaggageReportRecord['issueCategory']>('missing');
  const [repDetails, setRepDetails] = useState('');
  const [repSubmitting, setRepSubmitting] = useState(false);
  const [repSuccess, setRepSuccess] = useState('');
  const [repError, setRepError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [bagRes, repRes, flRes] = await Promise.all([
        api.listBaggage(),
        api.listReports(),
        api.listFlights(),
      ]);
      setBags(bagRes.baggage);
      setReports(repRes.reports);
      setFlights(flRes.flights);
      setError('');
      return bagRes.baggage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load baggage concierge data.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const openBagDetail = useCallback(async (bagId: string, shouldScroll = false) => {
    const clean = bagId.trim().toUpperCase();
    if (!clean) return;
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const res = await api.trackBaggage(clean);
      setSelectedDetail({
        baggage: res.baggage,
        flight: res.flight,
        events: res.events,
        qrDataUrl: res.qrDataUrl,
      });
      if (shouldScroll) {
        setTimeout(() => {
          document.getElementById('follow-my-bag-stage')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    } catch (err) {
      setTrackingError(err instanceof Error ? err.message : 'Baggage ID not found.');
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData().then((loaded) => {
      if (focusBagId) {
        openBagDetail(focusBagId, true);
      } else if (loaded.length > 0 && !selectedDetail) {
        openBagDetail(loaded[0].bagId);
      }
    });
  }, [liveSignal, focusBagId]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepSubmitting(true);
    setRepError('');
    setRepSuccess('');
    try {
      const res = await api.createReport({
        bagId: repBagId,
        flightNumber: repFlight,
        description: repDesc,
        color: repColor,
        baggageType: repType,
        lastKnownLocation: repLocation,
        issueCategory: repCategory,
        details: repDetails,
      });
      setRepSuccess(`Concierge report ${res.report.id} filed for ${res.report.bagId}.`);
      setRepBagId('');
      setRepFlight('');
      setRepDesc('');
      setRepColor('');
      setRepLocation('');
      setRepDetails('');
      await loadData();
    } catch (err) {
      setRepError(err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setRepSubmitting(false);
    }
  };

  const inTransitCount = bags.filter((b) =>
    ['registered', 'in_transit', 'loaded', 'arrived', 'carousel'].includes(b.status)
  ).length;
  const deliveredCount = bags.filter((b) => b.status === 'delivered').length;
  const alertCount = bags.filter((b) =>
    ['delayed', 'missing', 'damaged'].includes(b.status)
  ).length;

  const primaryBag = selectedDetail?.baggage ?? bags[0] ?? null;
  const primaryFlight =
    selectedDetail?.flight ??
    flights.find((f) => f.flightNumber === primaryBag?.flightNumber) ??
    flights[0] ??
    null;

  const latestEvent =
    selectedDetail && selectedDetail.events.length > 0
      ? selectedDetail.events[selectedDetail.events.length - 1]
      : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F3F5F7] text-[#101B2D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Luxury Concierge Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#101B2D]/12 pb-6">
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono tracking-[0.18em] text-[#9E7B3B] font-semibold">
              SKYTRACE TRAVEL CONCIERGE
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#101B2D]">
              Good journey, {user?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-[#203650]/75">
              {user?.email} · Real-time luggage clarity across every departure, transfer, and arrival gate.
            </p>
          </div>

          <div className="inline-flex rounded-xl p-1 bg-[#E5E9EF] border border-[#101B2D]/10">
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'tracking'
                  ? 'bg-[#101B2D] text-[#F3F5F7]'
                  : 'text-[#203650] hover:text-[#101B2D]'
              }`}
            >
              Follow My Bag
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-[#101B2D] text-[#F3F5F7]'
                  : 'text-[#203650] hover:text-[#101B2D]'
              }`}
            >
              Support &amp; Claims ({reports.length})
            </button>
          </div>
        </div>

        {/* Soft Grey & White Concierge Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#101B2D]/10 bg-white p-5">
            <div className="text-xs text-[#203650]/75">Checked Bags</div>
            <div className="mt-1.5 text-2xl font-mono font-bold tabular-nums text-[#101B2D]">
              {bags.length}
            </div>
          </div>
          <div className="rounded-2xl border border-[#101B2D]/10 bg-white p-5">
            <div className="text-xs text-[#203650]/75">In Active Transit</div>
            <div className="mt-1.5 text-2xl font-mono font-bold tabular-nums text-[#157A8C]">
              {inTransitCount}
            </div>
          </div>
          <div className="rounded-2xl border border-[#101B2D]/10 bg-white p-5">
            <div className="text-xs text-[#203650]/75">Delivered at Claim</div>
            <div className="mt-1.5 text-2xl font-mono font-bold tabular-nums text-[#1C7C61]">
              {deliveredCount}
            </div>
          </div>
          <div className="rounded-2xl border border-[#101B2D]/10 bg-white p-5">
            <div className="text-xs text-[#203650]/75">Priority Alerts</div>
            <div className="mt-1.5 text-2xl font-mono font-bold tabular-nums text-[#A66A14]">
              {alertCount}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-[#E87583]/45 bg-[#E87583]/10 text-xs text-[#9B2938]">
            {error}
          </div>
        )}

        {activeTab === 'tracking' ? (
          <div className="space-y-8">
            {/* Flight-Ticket Boarding Pass */}
            <DigitalBoardingPass
              passengerName={user?.fullName ?? 'Passenger'}
              flight={primaryFlight}
              primaryBag={primaryBag}
              totalBags={bags.length}
            />

            {/* Quick Baggage Lookup */}
            <BaggageSearchExperience
              initialQuery={selectedDetail?.baggage.bagId ?? ''}
              loading={trackingLoading}
              error={trackingError}
              suggestions={bags.slice(0, 4).map((b) => b.bagId)}
              onSearch={(id) => openBagDetail(id, true)}
              variant="light"
            />

            {/* Signature "Follow My Bag" Horizontal Experience + Side Info Panel */}
            <div id="follow-my-bag-stage" className="space-y-6">
              {selectedDetail ? (
                <motion.div
                  key={selectedDetail.baggage.bagId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >
                  {/* Main Follow My Bag Horizontal Journey */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-mono tracking-[0.16em] text-[#157A8C] font-semibold">
                          FOLLOW MY BAG · LIVE ROUTE
                        </div>
                        <h2 className="font-display text-2xl font-bold text-[#101B2D]">
                          {selectedDetail.baggage.departureAirport} to{' '}
                          {selectedDetail.baggage.arrivalAirport}
                        </h2>
                      </div>
                      <StatusIndicator
                        status={selectedDetail.baggage.status}
                        lightSurface={true}
                      />
                    </div>

                    <BaggageJourneyTimeline
                      key={selectedDetail.baggage.bagId}
                      events={selectedDetail.events}
                      bagStatus={selectedDetail.baggage.status}
                      currentCheckpointCode={selectedDetail.baggage.currentCheckpointCode}
                      variant="light"
                    />
                  </div>

                  {/* Flight-Ticket Inspired Concierge Side Card */}
                  <aside className="lg:col-span-4 rounded-2xl border border-[#101B2D]/12 bg-white overflow-hidden shadow-xs">
                    <div className="h-[2px] bg-ma-gold" />
                    <div className="p-6 space-y-5">
                      <div className="border-b border-[#101B2D]/10 pb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-mono text-[#9E7B3B]">BAG IDENTITY</div>
                          <div className="mt-1 font-mono text-2xl font-bold text-[#101B2D] tabular-nums">
                            {selectedDetail.baggage.bagId}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowQrModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#101B2D]/15 hover:border-[#157A8C] text-xs font-semibold text-[#101B2D] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#157A8C]" />
                          QR Tag
                        </button>
                      </div>

                      <dl className="space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-[#203650]/70">Flight</dt>
                          <dd className="font-mono font-bold text-[#101B2D]">
                            {selectedDetail.baggage.flightNumber}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-[#203650]/70">Destination</dt>
                          <dd className="font-mono font-semibold text-[#101B2D]">
                            {selectedDetail.baggage.arrivalAirport}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-[#203650]/70">Baggage Spec</dt>
                          <dd className="font-medium text-[#101B2D]">
                            {selectedDetail.baggage.color} {selectedDetail.baggage.baggageType} ·{' '}
                            <span className="font-mono tabular-nums">
                              {selectedDetail.baggage.weightKg} kg
                            </span>
                          </dd>
                        </div>
                        <div className="pt-2 border-t border-[#101B2D]/10">
                          <dt className="text-[#203650]/70">Current Location</dt>
                          <dd className="mt-1 font-semibold text-[#101B2D]">
                            {selectedDetail.baggage.currentLocation}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[#203650]/70">Latest Update</dt>
                          <dd className="mt-1 font-mono tabular-nums text-[#203650]">
                            {latestEvent
                              ? new Date(latestEvent.timestamp).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : new Date(selectedDetail.baggage.updatedAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                          </dd>
                        </div>
                      </dl>

                      <div className="pt-3 border-t border-[#101B2D]/10">
                        <button
                          type="button"
                          onClick={() => {
                            setRepBagId(selectedDetail.baggage.bagId);
                            setRepFlight(selectedDetail.baggage.flightNumber);
                            setRepColor(selectedDetail.baggage.color);
                            setRepType(selectedDetail.baggage.baggageType);
                            setRepLocation(selectedDetail.baggage.currentLocation);
                            setActiveTab('reports');
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#101B2D]/15 hover:border-[#A66A14] text-xs font-semibold text-[#101B2D] hover:text-[#A66A14] transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Need Assistance With This Bag?
                        </button>
                      </div>
                    </div>
                  </aside>
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-[#101B2D]/12 bg-white p-12 text-center text-sm text-[#203650]/75">
                  <Plane className="w-8 h-8 text-[#157A8C] mx-auto mb-3" />
                  Select a checked bag below or search any Bag ID to follow its live airport journey.
                </div>
              )}
            </div>

            {/* Checked Bags Collection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Luggage className="w-4 h-4 text-[#157A8C]" />
                  <h3 className="text-sm font-semibold text-[#101B2D]">
                    Your Registered Checked Baggage
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#203650]/70 tabular-nums">
                  {bags.length} Bag(s)
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-xl border border-[#101B2D]/10 bg-white animate-pulse"
                    />
                  ))}
                </div>
              ) : bags.length === 0 ? (
                <div className="rounded-2xl border border-[#101B2D]/10 bg-white p-8 text-center text-xs text-[#203650]/75">
                  No checked baggage is currently linked to {user?.email}. Use the lookup bar above with any Bag ID from your tag receipt.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bags.map((bag) => (
                    <BaggageIdentityCard
                      key={bag.id}
                      baggage={bag}
                      selected={selectedDetail?.baggage.bagId === bag.bagId}
                      lightSurface={true}
                      onSelect={() => openBagDetail(bag.bagId, true)}
                      onViewQr={async () => {
                        await openBagDetail(bag.bagId, false);
                        setShowQrModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Support & Claims Tab */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleReportSubmit}
              className="lg:col-span-6 rounded-2xl border border-[#101B2D]/12 bg-white p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-2 border-b border-[#101B2D]/10 pb-3">
                <FileWarning className="w-4 h-4 text-[#A66A14]" />
                <h2 className="text-base font-semibold text-[#101B2D]">
                  File Missing or Damaged Baggage Claim
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#203650] mb-1">Bag ID</label>
                  <input
                    type="text"
                    required
                    value={repBagId}
                    onChange={(e) => setRepBagId(e.target.value)}
                    placeholder="ST-2026-4816"
                    className="w-full px-3 py-2 rounded-lg border border-[#101B2D]/20 bg-[#F3F5F7] text-sm font-mono text-[#101B2D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#203650] mb-1">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    required
                    value={repFlight}
                    onChange={(e) => setRepFlight(e.target.value)}
                    placeholder="SK-215"
                    className="w-full px-3 py-2 rounded-lg border border-[#101B2D]/20 bg-[#F3F5F7] text-sm font-mono text-[#101B2D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#203650] mb-1">
                    Issue Category
                  </label>
                  <select
                    value={repCategory}
                    onChange={(e) =>
                      setRepCategory(e.target.value as LostBaggageReportRecord['issueCategory'])
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#101B2D]/20 bg-[#F3F5F7] text-sm text-[#101B2D]"
                  >
                    <option value="missing">Missing</option>
                    <option value="damaged">Damaged</option>
                    <option value="delayed_connection">Delayed Connection</option>
                    <option value="tampered">Tampered Seal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#203650] mb-1">
                    Baggage Color
                  </label>
                  <input
                    type="text"
                    required
                    value={repColor}
                    onChange={(e) => setRepColor(e.target.value)}
                    placeholder="Midnight Navy"
                    className="w-full px-3 py-2 rounded-lg border border-[#101B2D]/20 bg-[#F3F5F7] text-sm text-[#101B2D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#203650] mb-1">
                    Baggage Type
                  </label>
                  <select
                    value={repType}
                    onChange={(e) => setRepType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#101B2D]/20 bg-[#F3F5F7] text-sm text-[#101B2D]"
                  >
                    <option value="Hardshell">Hardshell</option>
                    <option value="Softshell">Softshell</option>
                    <option value="Duffel">Duffel</option>
                    <option value="Priority Case">Priority Case</option>
                    <option value="Oversized">Oversized</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#203650] mb-1">
                  Last Known Location
                </label>
                <input
                  type="text"
                  required
                  value={repLocation}
                  onChange={(e) => setRepLocation(e.target.value)}
                  placeholder="e.g. HND Arrivals Carousel C-02"
                  className="w-full px-3 py-2 rounded-lg border border-[#101B2D]/20 bg-[#F3F5F7] text-sm text-[#101B2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#203650] mb-1">
                  Baggage Description
                </label>
                <input
                  type="text"
                  required
                  value={repDesc}
                  onChange={(e) => setRepDesc(e.target.value)}
                  placeholder="Identifying tags, straps, luggage brand..."
                  className="w-full px-3 py-2 rounded-lg border border-[#101B2D]/20 bg-[#F3F5F7] text-sm text-[#101B2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#203650] mb-1">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={repDetails}
                  onChange={(e) => setRepDetails(e.target.value)}
                  placeholder="Describe damage or circumstances..."
                  className="w-full px-3 py-2 rounded-lg border border-[#101B2D]/20 bg-[#F3F5F7] text-sm text-[#101B2D]"
                />
              </div>

              {repError && (
                <div className="p-3 rounded-lg bg-[#E87583]/15 border border-[#E87583]/45 text-xs text-[#9B2938]">
                  {repError}
                </div>
              )}
              {repSuccess && (
                <div className="p-3 rounded-lg bg-[#52C7A5]/15 border border-[#52C7A5]/45 text-xs text-[#1C7C61] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{repSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={repSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#101B2D] hover:bg-[#203650] disabled:opacity-60 text-[#F3F5F7] text-xs font-bold tracking-wider cursor-pointer transition-colors"
              >
                {repSubmitting ? 'SUBMITTING...' : 'SUBMIT CONCIERGE REPORT'}
              </button>
            </form>

            <div className="lg:col-span-6 rounded-2xl border border-[#101B2D]/12 bg-white overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-[#101B2D]/10 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#101B2D]">Your Submitted Claims</h2>
                <span className="text-xs font-mono text-[#203650]/75">{reports.length}</span>
              </div>

              {reports.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#203650]/75">
                  No missing or damaged baggage claims filed.
                </div>
              ) : (
                <div className="divide-y divide-[#101B2D]/10">
                  {reports.map((rep) => (
                    <div key={rep.id} className="p-5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#101B2D]">
                            {rep.bagId}
                          </span>
                          <span className="text-[#101B2D]/30">·</span>
                          <span className="text-xs font-mono text-[#203650]/75">
                            {rep.flightNumber}
                          </span>
                          <span className="text-[#101B2D]/30">·</span>
                          <span className="text-xs capitalize text-[#A66A14] font-medium">
                            {rep.issueCategory.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs font-mono uppercase text-[#157A8C] font-semibold">
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#203650]">{rep.description}</p>
                      <div className="text-xs text-[#203650]/75">
                        Last known: {rep.lastKnownLocation}
                      </div>
                      {rep.resolutionNotes && (
                        <div className="p-3 rounded-lg bg-[#F3F5F7] border border-[#101B2D]/10 text-xs text-[#101B2D]">
                          Concierge Note: {rep.resolutionNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showQrModal && selectedDetail && (
        <QrCardModal
          baggage={selectedDetail.baggage}
          qrDataUrl={selectedDetail.qrDataUrl}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
}
