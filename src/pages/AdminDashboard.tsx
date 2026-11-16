import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Download,
  LayoutDashboard,
  Luggage,
  Network,
  Plane,
  Radio,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, getStoredToken } from '../services/api';
import type {
  AirportCheckpointRecord,
  BaggageRecord,
  FlightRecord,
  LostBaggageReportRecord,
  SafeUser,
  StaffActivityRecord,
} from '../types';
import { AirportDigitalTwin } from '../components/AirportDigitalTwin';
import { AirportNetworkVisualization } from '../components/AirportNetworkVisualization';
import { AIInsightPanel } from '../components/AIInsightPanel';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { FlightDataTable } from '../components/FlightDataTable';
import { FlightStatusPanel } from '../components/FlightStatusPanel';
import { LiveActivityFeed } from '../components/LiveActivityFeed';
import { OperationalAlert } from '../components/OperationalAlert';

type AdminSection =
  | 'overview'
  | 'live_ops'
  | 'intelligence'
  | 'flights'
  | 'checkpoints'
  | 'incidents'
  | 'staff'
  | 'analytics'
  | 'settings';

const NAV_ITEMS: { id: AdminSection; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'live_ops', label: 'Live Operations', Icon: Luggage },
  { id: 'intelligence', label: 'Baggage Intelligence', Icon: BrainCircuit },
  { id: 'flights', label: 'Flight Control', Icon: Plane },
  { id: 'checkpoints', label: 'Checkpoint Network', Icon: Network },
  { id: 'incidents', label: 'Incidents', Icon: ShieldAlert },
  { id: 'staff', label: 'Staff Activity', Icon: Users },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export function AdminDashboard({ liveSignal }: { liveSignal: number }) {
  const [section, setSection] = useState<AdminSection>('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    totalBaggage: number;
    registered: number;
    inTransit: number;
    delivered: number;
    delayed: number;
    missing: number;
    damaged: number;
    activeFlights: number;
    totalScans: number;
    openReports: number;
    totalUsers: number;
    activeCheckpoints: number;
  } | null>(null);

  const [analytics, setAnalytics] = useState<{
    statusBreakdown: { name: string; count: number; color: string }[];
    flightDistribution: {
      flightNumber: string;
      route: string;
      total: number;
      delivered: number;
      inTransit: number;
      exceptions: number;
    }[];
    checkpointActivity: {
      checkpoint: string;
      scans: number;
      qrScans: number;
      rfidScans: number;
    }[];
    hourlyTrend: { window: string; scans: number }[];
  } | null>(null);

  const [bags, setBags] = useState<BaggageRecord[]>([]);
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [checkpoints, setCheckpoints] = useState<AirportCheckpointRecord[]>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [reports, setReports] = useState<LostBaggageReportRecord[]>([]);
  const [activity, setActivity] = useState<StaffActivityRecord[]>([]);
  const [healthInfo, setHealthInfo] = useState<{
    status: string;
    dbMode: string;
    aiConfigured: boolean;
    timestamp: string;
  } | null>(null);

  // Live Operations search/filter/pagination
  const [bagSearch, setBagSearch] = useState('');
  const [bagStatus, setBagStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 7;

  // Create Flight form
  const [newFlightNum, setNewFlightNum] = useState('');
  const [newDep, setNewDep] = useState('');
  const [newArr, setNewArr] = useState('');
  const [newGate, setNewGate] = useState('T2-B10');

  // Create Staff form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [staffDept, setStaffDept] = useState('Ramp Operations');
  const [staffMsg, setStaffMsg] = useState('');

  // Incident resolution state
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [reportStatus, setReportStatus] =
    useState<LostBaggageReportRecord['status']>('investigating');

  const loadAdminData = useCallback(async () => {
    try {
      const [ov, an, bg, fl, cp, us, rp, ac] = await Promise.all([
        api.adminOverview(),
        api.adminAnalytics(),
        api.listBaggage(),
        api.listFlights(),
        api.listCheckpoints(),
        api.adminUsers(),
        api.listReports(),
        api.adminActivity(),
      ]);
      setMetrics(ov.metrics);
      setAnalytics(an.analytics);
      setBags(bg.baggage);
      setFlights(fl.flights);
      setCheckpoints(cp.checkpoints);
      setUsers(us.users);
      setReports(rp.reports);
      setActivity(ac.activity);

      fetch('/api/health')
        .then((r) => r.json())
        .then((h) => setHealthInfo(h))
        .catch(() => {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [liveSignal, loadAdminData]);

  const handleExportCsv = async () => {
    const token = getStoredToken();
    const res = await fetch('/api/admin/export/csv', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skytrace-baggage-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.adminCreateFlight({
      flightNumber: newFlightNum,
      departureAirport: newDep,
      arrivalAirport: newArr,
      gate: newGate,
    });
    setNewFlightNum('');
    setNewDep('');
    setNewArr('');
    await loadAdminData();
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMsg('');
    try {
      const res = await api.adminCreateStaff({
        fullName: staffName,
        email: staffEmail,
        password: staffPass,
        department: staffDept,
      });
      setStaffMsg(`Created operator ${res.staff.fullName} (${res.staff.employeeId}).`);
      setStaffName('');
      setStaffEmail('');
      setStaffPass('');
      await loadAdminData();
    } catch (err) {
      setStaffMsg(err instanceof Error ? err.message : 'Unable to create staff.');
    }
  };

  const handleSaveReport = async (id: string) => {
    await api.updateReport(id, { status: reportStatus, resolutionNotes: reportNote });
    setEditingReportId(null);
    await loadAdminData();
  };

  const filteredBags = bags.filter((b) => {
    if (bagStatus !== 'all' && b.status !== bagStatus) return false;
    if (bagSearch.trim()) {
      const q = bagSearch.toLowerCase();
      return (
        b.bagId.toLowerCase().includes(q) ||
        b.flightNumber.toLowerCase().includes(q) ||
        b.passengerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBags.length / pageSize));
  const pagedBags = filteredBags.slice((page - 1) * pageSize, page * pageSize);

  const exceptionBags = bags.filter((b) =>
    ['delayed', 'missing', 'damaged'].includes(b.status)
  );

  const getStatusChartColor = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes('deliver') || key.includes('arrived')) return '#52C7A5';
    if (key.includes('delay')) return '#F0B85B';
    if (key.includes('missing') || key.includes('damag')) return '#E87583';
    if (key.includes('register')) return '#C9A96E';
    if (key.includes('load')) return '#78E6D8';
    return '#54D6E8';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#101B2D] text-[#F3F5F7] flex flex-col lg:flex-row aviation-noise">
      {/* Left Navigation Rail (9 Required Command Sections) */}
      <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#203650] bg-[#0D1626] p-4 space-y-6">
        <div className="px-2 hidden lg:block">
          <div className="text-[11px] font-mono tracking-[0.18em] text-[#C9A96E]">
            AIRPORT DIGITAL TWIN
          </div>
          <div className="mt-1 text-sm font-semibold text-[#F3F5F7]">Command Navigation</div>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
          {NAV_ITEMS.map((item) => {
            const active = section === item.id;
            const badge =
              item.id === 'incidents' && reports.length > 0 ? reports.length : undefined;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#203650] text-[#54D6E8] border border-[#54D6E8]/35'
                    : 'text-[#A8B6C7] hover:text-[#F3F5F7] hover:bg-[#16253C] border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <item.Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {badge !== undefined && (
                  <span className="font-mono text-[11px] text-[#F0B85B]">{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block pt-4 border-t border-[#203650] px-2 space-y-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-ma-aurora hover:opacity-95 text-[#101B2D] text-xs font-bold transition-opacity cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Operations CSV
          </button>
        </div>
      </aside>

      {/* Main Command Workspace */}
      <div className="flex-1 min-w-0 p-5 sm:p-8 space-y-6">
        {/* Top Command Header */}
        <div className="border-b border-[#203650] pb-5 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono tracking-[0.18em] text-[#54D6E8]">
                {NAV_ITEMS.find((n) => n.id === section)?.label.toUpperCase()}
              </div>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#F3F5F7]">
                SKYTRACE Airport Command Center
              </h1>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ma-aurora text-[#101B2D] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          <div className="h-[1px] w-28 bg-ma-gold opacity-70" />
        </div>

        {/* Section 1: Overview */}
        {section === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5">
                <div className="text-xs text-[#A8B6C7]">Total Tracked Baggage</div>
                <div className="mt-2 text-3xl font-bold text-[#F3F5F7]">
                  {loading ? '—' : <AnimatedCounter value={metrics?.totalBaggage} />}
                </div>
              </div>
              <div className="rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5">
                <div className="text-xs text-[#A8B6C7]">In Transit / Loaded</div>
                <div className="mt-2 text-3xl font-bold text-[#54D6E8]">
                  {loading ? '—' : <AnimatedCounter value={metrics?.inTransit} />}
                </div>
              </div>
              <div className="rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5">
                <div className="text-xs text-[#A8B6C7]">Delivered to Reclaim</div>
                <div className="mt-2 text-3xl font-bold text-[#52C7A5]">
                  {loading ? '—' : <AnimatedCounter value={metrics?.delivered} />}
                </div>
              </div>
              <div className="rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5">
                <div className="text-xs text-[#A8B6C7]">Delayed / Exceptions</div>
                <div className="mt-2 text-3xl font-bold text-[#F0B85B]">
                  {loading ? (
                    '—'
                  ) : (
                    <AnimatedCounter
                      value={
                        (metrics?.delayed ?? 0) + (metrics?.missing ?? 0) + (metrics?.damaged ?? 0)
                      }
                    />
                  )}
                </div>
              </div>
            </div>

            {exceptionBags.length > 0 && (
              <OperationalAlert
                severity="critical"
                title={`${exceptionBags.length} Active Baggage Exception(s) Across Hub`}
                message={`${exceptionBags[0].bagId} (${exceptionBags[0].flightNumber}) is flagged ${exceptionBags[0].status.toUpperCase()} at ${exceptionBags[0].currentLocation}.`}
                meta={`Open Incident Reports: ${metrics?.openReports ?? reports.length}`}
                actionLabel="Open Baggage Intelligence"
                onAction={() => setSection('intelligence')}
              />
            )}

            <AirportDigitalTwin
              bags={bags}
              checkpoints={checkpoints}
              reports={reports}
              activity={activity}
            />
          </div>
        )}

        {/* Section 2: Live Operations */}
        {section === 'live_ops' && (
          <div className="space-y-6">
            <AirportDigitalTwin
              bags={bags}
              checkpoints={checkpoints}
              reports={reports}
              activity={activity}
            />

            <div className="rounded-2xl border border-[#203650] bg-[#101B2D] overflow-hidden">
              <div className="p-4 border-b border-[#203650] flex flex-wrap items-center justify-between gap-3 bg-[#16253C]/80">
                <input
                  type="text"
                  value={bagSearch}
                  onChange={(e) => {
                    setBagSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter by Bag ID, flight number, or passenger..."
                  className="w-full sm:w-80 px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7] placeholder:text-[#A8B6C7]/60 focus:border-[#54D6E8] focus:outline-none"
                />
                <select
                  value={bagStatus}
                  onChange={(e) => {
                    setBagStatus(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="registered">Registered</option>
                  <option value="in_transit">In Transit</option>
                  <option value="loaded">Aircraft Loaded</option>
                  <option value="carousel">At Carousel</option>
                  <option value="delivered">Delivered</option>
                  <option value="delayed">Delayed</option>
                  <option value="missing">Missing</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <FlightDataTable bags={pagedBags} />

              <div className="px-4 py-3 border-t border-[#203650] flex items-center justify-between text-xs text-[#A8B6C7]">
                <span className="font-mono tabular-nums">
                  Showing {pagedBags.length} of {filteredBags.length} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-2.5 py-1 rounded border border-[#203650] hover:border-[#54D6E8]/50 disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="font-mono tabular-nums">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2.5 py-1 rounded border border-[#203650] hover:border-[#54D6E8]/50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Baggage Intelligence */}
        {section === 'intelligence' && <AIInsightPanel />}

        {/* Section 4: Flight Control */}
        {section === 'flights' && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateFlight}
              className="rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5 space-y-4"
            >
              <h3 className="text-sm font-semibold text-[#F3F5F7]">Register Monitored Flight</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <input
                  type="text"
                  required
                  value={newFlightNum}
                  onChange={(e) => setNewFlightNum(e.target.value.toUpperCase())}
                  placeholder="SK-905"
                  className="px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs font-mono text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={newDep}
                  onChange={(e) => setNewDep(e.target.value.toUpperCase())}
                  placeholder="LAX"
                  maxLength={4}
                  className="px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs font-mono text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={newArr}
                  onChange={(e) => setNewArr(e.target.value.toUpperCase())}
                  placeholder="NRT"
                  maxLength={4}
                  className="px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs font-mono text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
                <input
                  type="text"
                  value={newGate}
                  onChange={(e) => setNewGate(e.target.value.toUpperCase())}
                  placeholder="Gate"
                  className="px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs font-mono text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-ma-aurora hover:opacity-95 text-[#101B2D] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 transition-opacity"
                >
                  Create Flight
                </button>
              </div>
            </form>

            <FlightStatusPanel flights={flights} bags={bags} />

            <div className="rounded-2xl border border-[#203650] bg-[#101B2D] divide-y divide-[#203650]">
              <div className="px-5 py-4 border-b border-[#203650] text-sm font-semibold text-[#F3F5F7]">
                Live Flight Status Control
              </div>
              {flights.map((f) => (
                <div key={f.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-mono font-bold text-[#F3F5F7]">
                      {f.flightNumber} · {f.departureAirport} → {f.arrivalAirport}
                    </div>
                    <div className="text-[#A8B6C7] mt-0.5">
                      Gate {f.gate} · Carousel {f.carousel}
                    </div>
                  </div>
                  <select
                    value={f.status}
                    onChange={async (e) => {
                      await api.adminUpdateFlight(f.id, {
                        status: e.target.value as FlightRecord['status'],
                      });
                      await loadAdminData();
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#203650] bg-[#16253C] text-xs text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="boarding">Boarding</option>
                    <option value="departed">Departed</option>
                    <option value="in_flight">In Flight</option>
                    <option value="arrived">Arrived</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Checkpoint Network */}
        {section === 'checkpoints' && (
          <div className="space-y-6">
            <AirportNetworkVisualization />

            <div className="rounded-2xl border border-[#203650] bg-[#101B2D] divide-y divide-[#203650]">
              <div className="px-5 py-4 border-b border-[#203650] flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F5F7]">
                  <Radio className="w-4 h-4 text-[#54D6E8]" />
                  <span>Terminal Checkpoint Gates &amp; RFID Portals</span>
                </div>
                <span className="text-xs font-mono text-[#A8B6C7]">
                  {checkpoints.filter((c) => c.active).length} / {checkpoints.length} Active
                </span>
              </div>
              {checkpoints.map((cp) => (
                <div key={cp.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-[#F3F5F7]">
                      {cp.sequenceOrder}. {cp.name}
                    </div>
                    <div className="text-[#A8B6C7] mt-0.5">
                      {cp.zone} · <span className="font-mono text-[#C9A96E]">{cp.rfidGateId}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.adminUpdateCheckpoint(cp.id, { active: !cp.active });
                      await loadAdminData();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                      cp.active
                        ? 'bg-[#52C7A5]/15 text-[#52C7A5] border border-[#52C7A5]/35'
                        : 'bg-[#203650]/40 text-[#A8B6C7] border border-[#203650]'
                    }`}
                  >
                    {cp.active ? 'ACTIVE GATE' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 6: Incidents */}
        {section === 'incidents' && (
          <div className="rounded-2xl border border-[#203650] bg-[#16253C]/80 divide-y divide-[#203650]">
            <div className="px-5 py-4 border-b border-[#203650] flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F5F7]">
                <ShieldAlert className="w-4 h-4 text-[#F0B85B]" />
                <span>Missing, Delayed &amp; Damaged Baggage Claims ({reports.length})</span>
              </div>
            </div>
            {reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A8B6C7]">
                No incident reports currently filed.
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep.id} className="p-5 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-mono font-bold text-[#F3F5F7]">{rep.bagId}</span>
                      <span className="mx-2 text-[#A8B6C7]">·</span>
                      <span className="font-mono text-xs text-[#54D6E8]">{rep.flightNumber}</span>
                      <span className="mx-2 text-[#A8B6C7]">·</span>
                      <span className="text-xs text-[#A8B6C7]">{rep.passengerName}</span>
                    </div>
                    <span className="font-mono uppercase font-semibold text-[#F0B85B]">
                      {rep.issueCategory.replace('_', ' ')} · {rep.status}
                    </span>
                  </div>
                  <p className="text-[#F3F5F7]/90">{rep.description}</p>
                  <div className="text-[#A8B6C7]">
                    Last known: {rep.lastKnownLocation} · {rep.details}
                  </div>
                  {rep.resolutionNotes && (
                    <div className="p-2.5 rounded-lg bg-[#101B2D] border border-[#203650] text-[#54D6E8]">
                      Resolution Note: {rep.resolutionNotes}
                    </div>
                  )}

                  {editingReportId === rep.id ? (
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <select
                        value={reportStatus}
                        onChange={(e) =>
                          setReportStatus(e.target.value as LostBaggageReportRecord['status'])
                        }
                        className="px-3 py-1.5 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7]"
                      >
                        <option value="open">Open</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <input
                        type="text"
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        placeholder="Resolution trace notes..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveReport(rep.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ma-aurora text-[#101B2D] font-bold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReportId(rep.id);
                        setReportStatus(rep.status);
                        setReportNote(rep.resolutionNotes);
                      }}
                      className="text-[#54D6E8] font-medium hover:underline cursor-pointer"
                    >
                      Update Claim Resolution
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Section 7: Staff Activity & User Governance */}
        {section === 'staff' && (
          <div className="space-y-6">
            <LiveActivityFeed activity={activity} limit={12} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleCreateStaff}
                className="lg:col-span-4 rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5 space-y-4"
              >
                <h3 className="text-sm font-semibold text-[#F3F5F7]">
                  Provision Staff Operator
                </h3>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="operator@skytrace.aero"
                  className="w-full px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={staffPass}
                  onChange={(e) => setStaffPass(e.target.value)}
                  placeholder="Temporary Password"
                  className="w-full px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
                <input
                  type="text"
                  value={staffDept}
                  onChange={(e) => setStaffDept(e.target.value)}
                  placeholder="Department"
                  className="w-full px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
                {staffMsg && <div className="text-xs text-[#52C7A5]">{staffMsg}</div>}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-ma-aurora hover:opacity-95 text-[#101B2D] text-xs font-bold cursor-pointer transition-opacity"
                >
                  Create Staff Account
                </button>
              </form>

              <div className="lg:col-span-8 rounded-2xl border border-[#203650] bg-[#101B2D] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#203650] bg-[#16253C]/70 text-[#A8B6C7]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Name</th>
                        <th className="py-3 px-4 font-medium">Email</th>
                        <th className="py-3 px-4 font-medium">Role</th>
                        <th className="py-3 px-4 font-medium text-right">Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#203650]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#16253C]/45 transition-colors">
                          <td className="py-3 px-4 font-medium text-[#F3F5F7]">{u.fullName}</td>
                          <td className="py-3 px-4 font-mono text-[#A8B6C7]">{u.email}</td>
                          <td className="py-3 px-4 capitalize text-[#C9A96E]">{u.role}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                await api.adminUpdateUser(u.id, { active: !u.active });
                                await loadAdminData();
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold cursor-pointer ${
                                u.active
                                  ? 'bg-[#52C7A5]/15 text-[#52C7A5]'
                                  : 'bg-[#E87583]/15 text-[#E87583]'
                              }`}
                            >
                              {u.active ? 'ACTIVE' : 'SUSPENDED'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 8: Analytics */}
        {section === 'analytics' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5">
              <h3 className="text-sm font-semibold text-[#F3F5F7] mb-4">
                Flight-Wise Baggage Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.flightDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#203650" opacity={0.7} />
                    <XAxis dataKey="flightNumber" tick={{ fontSize: 11, fill: '#A8B6C7' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#A8B6C7' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101B2D',
                        borderColor: '#203650',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F3F5F7',
                      }}
                    />
                    <Bar dataKey="inTransit" name="In Transit" fill="#54D6E8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="delivered" name="Delivered" fill="#52C7A5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="exceptions" name="Exceptions" fill="#F0B85B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5">
              <h3 className="text-sm font-semibold text-[#F3F5F7] mb-4">
                Baggage Status Breakdown
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusBreakdown.filter((s) => s.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {analytics.statusBreakdown
                        .filter((s) => s.count > 0)
                        .map((entry) => (
                          <Cell key={entry.name} fill={getStatusChartColor(entry.name)} />
                        ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101B2D',
                        borderColor: '#203650',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F3F5F7',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                {analytics.statusBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center justify-between px-2">
                    <span className="flex items-center gap-1.5 text-[#A8B6C7]">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: getStatusChartColor(s.name) }}
                      />
                      {s.name}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-[#F3F5F7]">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5">
              <h3 className="text-sm font-semibold text-[#F3F5F7] mb-4">
                Checkpoint Scan Throughput (QR vs Simulated RFID)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.checkpointActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#203650" opacity={0.7} />
                    <XAxis dataKey="checkpoint" tick={{ fontSize: 10, fill: '#A8B6C7' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#A8B6C7' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101B2D',
                        borderColor: '#203650',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F3F5F7',
                      }}
                    />
                    <Bar dataKey="qrScans" name="QR Scans" fill="#54D6E8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rfidScans" name="RFID Reads" fill="#C9A96E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#203650] bg-[#16253C]/85 p-5">
              <h3 className="text-sm font-semibold text-[#F3F5F7] mb-4">
                Scan Activity Window (Last 16h)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.hourlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#203650" opacity={0.7} />
                    <XAxis dataKey="window" tick={{ fontSize: 10, fill: '#A8B6C7' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#A8B6C7' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101B2D',
                        borderColor: '#203650',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#F3F5F7',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="scans"
                      stroke="#54D6E8"
                      fill="#54D6E8"
                      fillOpacity={0.22}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Section 9: Settings & Platform Diagnostics */}
        {section === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 rounded-2xl border border-[#203650] bg-[#16253C]/85 p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-[#203650] pb-3">
                <Activity className="w-4 h-4 text-[#54D6E8]" />
                <h3 className="text-base font-semibold text-[#F3F5F7]">
                  Operational Infrastructure Diagnostics
                </h3>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-4">
                  <dt className="text-[#A8B6C7]">Database Persistence</dt>
                  <dd className="mt-1 font-mono font-bold text-[#52C7A5]">
                    {healthInfo?.dbMode ?? 'Checking...'}
                  </dd>
                </div>
                <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-4">
                  <dt className="text-[#A8B6C7]">Gemini Intelligence Engine</dt>
                  <dd className="mt-1 font-mono font-bold text-[#54D6E8]">
                    {healthInfo?.aiConfigured ? 'Connected (Server-Side)' : 'Grounded Rules Mode'}
                  </dd>
                </div>
                <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-4">
                  <dt className="text-[#A8B6C7]">Active Checkpoints</dt>
                  <dd className="mt-1 font-mono font-bold text-[#C9A96E]">
                    {metrics?.activeCheckpoints ?? checkpoints.filter((c) => c.active).length} Gates
                  </dd>
                </div>
                <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-4">
                  <dt className="text-[#A8B6C7]">Real-Time Sync Transport</dt>
                  <dd className="mt-1 font-mono font-bold text-[#52C7A5]">Socket.IO Active</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#203650] bg-[#16253C]/70 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#F3F5F7]">Data Governance &amp; Export</h3>
              <p className="text-xs text-[#A8B6C7] leading-relaxed">
                Download a live snapshot of all checked baggage records, flight corridors, and exception flags as CSV for compliance auditing.
              </p>
              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-ma-aurora hover:opacity-95 text-[#101B2D] text-xs font-bold cursor-pointer transition-opacity"
              >
                <Download className="w-4 h-4" />
                Download Full Baggage CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
