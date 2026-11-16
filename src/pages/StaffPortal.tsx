import { useCallback, useEffect, useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Layers,
  Plane,
  PlusCircle,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type {
  BaggageRecord,
  FlightRecord,
  LostBaggageReportRecord,
  PassengerRecord,
} from '../types';
import { QRScanStation } from '../components/QRScanStation';
import { QrCardModal } from '../components/QrCardModal';
import { FlightDataTable } from '../components/FlightDataTable';
import { FlightStatusPanel } from '../components/FlightStatusPanel';
import { OperationalAlert } from '../components/OperationalAlert';
import { AIInsightPanel } from '../components/AIInsightPanel';
import { AnimatedCounter } from '../components/AnimatedCounter';

type StaffTab = 'scanner' | 'operations' | 'flights' | 'register' | 'incidents' | 'intelligence';

export function StaffPortal({
  liveSignal,
  focusBagId,
}: {
  liveSignal: number;
  focusBagId?: string | null;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<StaffTab>('scanner');
  const [bags, setBags] = useState<BaggageRecord[]>([]);
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [passengers, setPassengers] = useState<PassengerRecord[]>([]);
  const [reports, setReports] = useState<LostBaggageReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanTargetBagId, setScanTargetBagId] = useState<string | undefined>(
    focusBagId ?? undefined
  );

  // Registration form state
  const [regPassengerMode, setRegPassengerMode] = useState<'existing' | 'walkin'>('existing');
  const [regPassengerId, setRegPassengerId] = useState('');
  const [regPassengerName, setRegPassengerName] = useState('');
  const [regPassengerEmail, setRegPassengerEmail] = useState('');
  const [regFlightId, setRegFlightId] = useState('');
  const [regFlightNumber, setRegFlightNumber] = useState('');
  const [regDep, setRegDep] = useState('');
  const [regArr, setRegArr] = useState('');
  const [regType, setRegType] = useState<BaggageRecord['baggageType']>('Hardshell');
  const [regColor, setRegColor] = useState('Midnight Navy');
  const [regWeight, setRegWeight] = useState('21.5');
  const [regHandling, setRegHandling] = useState('Standard');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState('');
  const [createdCard, setCreatedCard] = useState<{
    baggage: BaggageRecord;
    qrDataUrl: string;
  } | null>(null);

  // Operations table filters
  const [opsSearch, setOpsSearch] = useState('');
  const [opsFlightFilter, setOpsFlightFilter] = useState('ALL');
  const [opsPriorityOnly, setOpsPriorityOnly] = useState(false);

  // Incident update state
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [reportStatus, setReportStatus] =
    useState<LostBaggageReportRecord['status']>('investigating');

  const loadWorkspace = useCallback(async () => {
    try {
      const [bRes, fRes, pRes, rRes] = await Promise.all([
        api.listBaggage(),
        api.listFlights(),
        api.listPassengers(),
        api.listReports(),
      ]);
      setBags(bRes.baggage);
      setFlights(fRes.flights);
      setPassengers(pRes.passengers);
      setReports(rRes.reports);
      if (pRes.passengers.length > 0 && !regPassengerId) {
        setRegPassengerId(pRes.passengers[0].id);
      }
      if (fRes.flights.length > 0 && !regFlightId) {
        const f = fRes.flights[0];
        setRegFlightId(f.id);
        setRegFlightNumber(f.flightNumber);
        setRegDep(f.departureAirport);
        setRegArr(f.arrivalAirport);
      }
    } finally {
      setLoading(false);
    }
  }, [regFlightId, regPassengerId]);

  useEffect(() => {
    loadWorkspace();
  }, [liveSignal, loadWorkspace]);

  useEffect(() => {
    if (focusBagId) {
      setScanTargetBagId(focusBagId);
      setTab('scanner');
    }
  }, [focusBagId]);

  const handleFlightPick = (id: string) => {
    setRegFlightId(id);
    const f = flights.find((fl) => fl.id === id);
    if (f) {
      setRegFlightNumber(f.flightNumber);
      setRegDep(f.departureAirport);
      setRegArr(f.arrivalAirport);
    }
  };

  const handleRegisterBaggage = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegSubmitting(true);
    setRegError('');
    try {
      const res = await api.registerBaggage({
        passengerId: regPassengerMode === 'existing' ? regPassengerId : undefined,
        passengerName: regPassengerMode === 'walkin' ? regPassengerName : undefined,
        passengerEmail: regPassengerMode === 'walkin' ? regPassengerEmail : undefined,
        flightId: regFlightId || undefined,
        flightNumber: regFlightNumber,
        departureAirport: regDep,
        arrivalAirport: regArr,
        baggageType: regType,
        color: regColor,
        weightKg: Number(regWeight),
        specialHandling: regHandling,
      });
      setCreatedCard({ baggage: res.baggage, qrDataUrl: res.qrDataUrl });
      await loadWorkspace();
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Failed to register baggage.');
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleOpenQrForBag = async (bag: BaggageRecord) => {
    try {
      const res = await api.getBaggageQr(bag.bagId);
      setCreatedCard({ baggage: bag, qrDataUrl: res.qrDataUrl });
    } catch {
      // ignore
    }
  };

  const handleSaveReportUpdate = async (id: string) => {
    await api.updateReport(id, { status: reportStatus, resolutionNotes: reportNote });
    setEditingReportId(null);
    await loadWorkspace();
  };

  const awaitingProcessing = bags.filter((b) =>
    ['registered', 'delayed', 'missing'].includes(b.status)
  ).length;
  const exceptionBags = bags.filter((b) =>
    ['delayed', 'missing', 'damaged'].includes(b.status)
  );
  const inTransitCount = bags.filter((b) =>
    ['in_transit', 'loaded', 'arrived', 'carousel'].includes(b.status)
  ).length;

  const filteredOpsBags = bags
    .filter((b) => {
      if (opsPriorityOnly && !['delayed', 'missing', 'damaged', 'registered'].includes(b.status)) {
        return false;
      }
      if (opsFlightFilter !== 'ALL' && b.flightNumber !== opsFlightFilter) return false;
      if (opsSearch.trim()) {
        const q = opsSearch.toLowerCase();
        return (
          b.bagId.toLowerCase().includes(q) ||
          b.passengerName.toLowerCase().includes(q) ||
          b.currentLocation.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const prio = (s: string) =>
        s === 'missing' || s === 'damaged' ? 0 : s === 'delayed' ? 1 : s === 'registered' ? 2 : 3;
      return prio(a.status) - prio(b.status);
    });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#101B2D] text-[#F3F5F7] aviation-noise">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Operational Shift & Checkpoint Priority Strip */}
        <div className="rounded-2xl border border-[#203650] bg-[#16253C]/90 overflow-hidden shadow-[0_12px_36px_rgba(6,12,24,0.35)]">
          <div className="h-[2px] w-full bg-ma-gold opacity-75" />
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono tracking-[0.18em] text-[#54D6E8]">
                  BAGGAGE CONTROL STATION
                </div>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#F3F5F7]">
                  Ground Ramp &amp; Checkpoint Operations
                </h1>
              </div>
              <div className="text-xs font-mono text-[#A8B6C7]">
                Operator: <span className="text-[#C9A96E] font-medium">{user?.fullName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-[#203650] text-xs">
              <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-3.5">
                <div className="text-[#A8B6C7]">Current Shift</div>
                <div className="mt-1 font-mono font-semibold text-[#F3F5F7]">Alpha Ramp Shift</div>
              </div>
              <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-3.5">
                <div className="text-[#A8B6C7]">Assigned Hub</div>
                <div className="mt-1 font-mono font-semibold text-[#54D6E8]">JFK Hub Network</div>
              </div>
              <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-3.5">
                <div className="text-[#A8B6C7]">Active Checkpoint</div>
                <div className="mt-1 font-mono font-semibold text-[#52C7A5]">Optical QR &amp; RFID</div>
              </div>
              <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-3.5">
                <div className="text-[#A8B6C7]">Active Flights</div>
                <div className="mt-1 text-lg font-mono font-bold text-[#F3F5F7]">
                  <AnimatedCounter value={flights.length} />
                </div>
              </div>
              <div className="rounded-xl border border-[#203650] bg-[#101B2D]/90 p-3.5">
                <div className="text-[#A8B6C7]">Awaiting Processing</div>
                <div className="mt-1 text-lg font-mono font-bold text-[#F0B85B]">
                  <AnimatedCounter value={awaitingProcessing} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#16253C] border border-[#203650]">
            {[
              { id: 'scanner', label: 'QR Scan Station', Icon: ScanLine },
              { id: 'operations', label: `Operational Queue (${bags.length})`, Icon: Layers },
              { id: 'flights', label: 'Flight Grouping', Icon: Plane },
              { id: 'register', label: 'Register & Issue QR', Icon: PlusCircle },
              { id: 'incidents', label: `Incidents (${reports.length})`, Icon: ClipboardList },
              { id: 'intelligence', label: 'AI Risk Engine', Icon: BrainCircuit },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as StaffTab)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  tab === item.id
                    ? 'bg-ma-aurora text-[#101B2D] font-bold shadow-sm'
                    : 'text-[#A8B6C7] hover:text-[#F3F5F7]'
                }`}
              >
                <item.Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-[#A8B6C7] tabular-nums">
            In Transit: <span className="text-[#54D6E8]">{inTransitCount}</span> · Exceptions:{' '}
            <span className="text-[#F0B85B]">{exceptionBags.length}</span>
          </div>
        </div>

        {/* Priority Exception Banner when exceptions exist */}
        {exceptionBags.length > 0 && tab === 'scanner' && (
          <OperationalAlert
            severity="warning"
            title={`${exceptionBags.length} Priority Baggage Exception(s) Require Checkpoint Attention`}
            message={`Lead flagged bag: ${exceptionBags[0].bagId} (${exceptionBags[0].flightNumber}) at ${exceptionBags[0].currentLocation}.`}
            meta={`Status: ${exceptionBags[0].status.toUpperCase()}`}
            actionLabel={`Scan ${exceptionBags[0].bagId}`}
            onAction={() => setScanTargetBagId(exceptionBags[0].bagId)}
          />
        )}

        {/* Active Station View */}
        {tab === 'scanner' && (
          <div className="rounded-2xl border border-[#203650] bg-[#16253C]/80 p-6">
            <QRScanStation
              initialBagId={scanTargetBagId}
              onScanCompleted={() => {
                loadWorkspace();
              }}
            />
          </div>
        )}

        {tab === 'operations' && (
          <div className="rounded-2xl border border-[#203650] bg-[#101B2D] overflow-hidden">
            <div className="p-4 border-b border-[#203650] flex flex-wrap items-center justify-between gap-3 bg-[#16253C]/80">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={opsSearch}
                  onChange={(e) => setOpsSearch(e.target.value)}
                  placeholder="Search Bag ID, passenger, or bay..."
                  className="w-full sm:w-72 px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7] placeholder:text-[#A8B6C7]/60 focus:border-[#54D6E8] focus:outline-none"
                />
                <select
                  value={opsFlightFilter}
                  onChange={(e) => setOpsFlightFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                >
                  <option value="ALL">All Flights</option>
                  {flights.map((f) => (
                    <option key={f.id} value={f.flightNumber}>
                      {f.flightNumber}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setOpsPriorityOnly((v) => !v)}
                className={`px-3 py-2 rounded-lg border text-xs font-mono cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  opsPriorityOnly
                    ? 'border-[#F0B85B] bg-[#F0B85B]/15 text-[#F0B85B]'
                    : 'border-[#203650] text-[#A8B6C7] hover:text-[#F3F5F7] hover:border-[#54D6E8]/40'
                }`}
              >
                {opsPriorityOnly ? 'Showing Priority Queue Only' : 'Filter Priority Queue'}
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-xs text-[#A8B6C7]">Loading operational queue...</div>
            ) : (
              <FlightDataTable
                bags={filteredOpsBags}
                onScan={(bagId) => {
                  setScanTargetBagId(bagId);
                  setTab('scanner');
                }}
                onQrCard={(bag) => handleOpenQrForBag(bag)}
              />
            )}
          </div>
        )}

        {tab === 'flights' && (
          <div className="space-y-4">
            <div className="text-xs text-[#A8B6C7]">
              Select any flight below to filter the Operational Queue by its baggage manifest.
            </div>
            <FlightStatusPanel
              flights={flights}
              bags={bags}
              onSelectFlight={(flightNum) => {
                setOpsFlightFilter(flightNum);
                setTab('operations');
              }}
            />
          </div>
        )}

        {tab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleRegisterBaggage}
              className="lg:col-span-7 rounded-2xl border border-[#203650] bg-[#16253C]/85 p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#203650] pb-4">
                <h2 className="text-base font-semibold text-[#F3F5F7]">
                  Register Checked Baggage &amp; Issue QR Tag
                </h2>
                <div className="inline-flex rounded-lg p-0.5 bg-[#101B2D] border border-[#203650]">
                  <button
                    type="button"
                    onClick={() => setRegPassengerMode('existing')}
                    className={`px-3 py-1 text-xs rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                      regPassengerMode === 'existing'
                        ? 'bg-[#203650] text-[#54D6E8] font-medium'
                        : 'text-[#A8B6C7]'
                    }`}
                  >
                    Registered Passenger
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegPassengerMode('walkin')}
                    className={`px-3 py-1 text-xs rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                      regPassengerMode === 'walkin'
                        ? 'bg-[#203650] text-[#54D6E8] font-medium'
                        : 'text-[#A8B6C7]'
                    }`}
                  >
                    Walk-in / Custom
                  </button>
                </div>
              </div>

              {regPassengerMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                    Select Passenger
                  </label>
                  <select
                    value={regPassengerId}
                    onChange={(e) => setRegPassengerId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                  >
                    {passengers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                      Passenger Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regPassengerName}
                      onChange={(e) => setRegPassengerName(e.target.value)}
                      placeholder="Jordan Vance"
                      className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                      Passenger Email
                    </label>
                    <input
                      type="email"
                      required
                      value={regPassengerEmail}
                      onChange={(e) => setRegPassengerEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                    Assigned Flight
                  </label>
                  <select
                    value={regFlightId}
                    onChange={(e) => handleFlightPick(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                  >
                    {flights.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.flightNumber} ({f.departureAirport} → {f.arrivalAirport})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                    Departure Airport
                  </label>
                  <input
                    type="text"
                    required
                    value={regDep}
                    onChange={(e) => setRegDep(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm font-mono text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                    Destination Airport
                  </label>
                  <input
                    type="text"
                    required
                    value={regArr}
                    onChange={(e) => setRegArr(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm font-mono text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                    Baggage Type
                  </label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value as BaggageRecord['baggageType'])}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                  >
                    <option value="Hardshell">Hardshell</option>
                    <option value="Softshell">Softshell</option>
                    <option value="Duffel">Duffel</option>
                    <option value="Priority Case">Priority Case</option>
                    <option value="Oversized">Oversized</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8B6C7] mb-1">Color</label>
                  <input
                    type="text"
                    required
                    value={regColor}
                    onChange={(e) => setRegColor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="65"
                    required
                    value={regWeight}
                    onChange={(e) => setRegWeight(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm font-mono text-[#F3F5F7] focus:border-[#54D6E8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8B6C7] mb-1">
                  Special Handling Notes
                </label>
                <input
                  type="text"
                  value={regHandling}
                  onChange={(e) => setRegHandling(e.target.value)}
                  placeholder="e.g. Fragile, Priority Tag, Lithium Battery Removed"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#203650] bg-[#101B2D] text-sm text-[#F3F5F7] placeholder:text-[#A8B6C7]/50 focus:border-[#54D6E8] focus:outline-none"
                />
              </div>

              {regError && (
                <div className="p-3 rounded-lg bg-[#E87583]/12 border border-[#E87583]/40 text-xs text-[#E87583]">
                  {regError}
                </div>
              )}

              <button
                type="submit"
                disabled={regSubmitting}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ma-aurora hover:opacity-95 disabled:opacity-60 text-[#101B2D] text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap shrink-0 transition-opacity"
              >
                <QrCode className="w-4 h-4" />
                {regSubmitting ? 'GENERATING TAG...' : 'REGISTER BAGGAGE & GENERATE QR CARD'}
              </button>
            </form>

            <div className="lg:col-span-5 rounded-2xl border border-[#203650] bg-[#16253C]/70 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#F3F5F7]">Recently Issued Baggage Tags</h3>
              <div className="divide-y divide-[#203650]">
                {bags.slice(0, 6).map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-[#F3F5F7]">{b.bagId}</div>
                      <div className="text-xs text-[#A8B6C7] truncate">
                        {b.passengerName} · {b.flightNumber} ({b.departureAirport} →{' '}
                        {b.arrivalAirport})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenQrForBag(b)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#203650] text-xs font-medium text-[#54D6E8] hover:border-[#54D6E8] cursor-pointer shrink-0 transition-colors"
                    >
                      Print QR
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'incidents' && (
          <div className="rounded-2xl border border-[#203650] bg-[#16253C]/80 divide-y divide-[#203650]">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A8B6C7]">
                No passenger incident reports filed.
              </div>
            ) : (
              reports.map((rep) => (
                <div key={rep.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-mono font-bold text-[#F3F5F7]">{rep.bagId}</span>
                      <span className="mx-2 text-[#A8B6C7]">·</span>
                      <span className="font-mono text-xs text-[#54D6E8]">{rep.flightNumber}</span>
                      <span className="mx-2 text-[#A8B6C7]">·</span>
                      <span className="text-xs text-[#A8B6C7]">{rep.passengerName}</span>
                    </div>
                    <span className="text-xs font-mono uppercase font-semibold text-[#F0B85B]">
                      {rep.issueCategory.replace('_', ' ')} · {rep.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#F3F5F7]/90">{rep.description}</p>
                  <div className="text-xs text-[#A8B6C7]">
                    Last known: {rep.lastKnownLocation} · {rep.details}
                  </div>

                  {editingReportId === rep.id ? (
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <select
                        value={reportStatus}
                        onChange={(e) =>
                          setReportStatus(e.target.value as LostBaggageReportRecord['status'])
                        }
                        className="px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7]"
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
                        placeholder="Add trace or resolution note..."
                        className="flex-1 px-3 py-2 rounded-lg border border-[#203650] bg-[#101B2D] text-xs text-[#F3F5F7]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveReportUpdate(rep.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ma-aurora text-[#101B2D] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
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
                      className="text-xs font-medium text-[#54D6E8] hover:underline cursor-pointer"
                    >
                      Update Investigation Status
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'intelligence' && <AIInsightPanel />}
      </div>

      {createdCard && (
        <QrCardModal
          baggage={createdCard.baggage}
          qrDataUrl={createdCard.qrDataUrl}
          onClose={() => setCreatedCard(null)}
        />
      )}
    </div>
  );
}
