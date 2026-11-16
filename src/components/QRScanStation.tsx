import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  Radio,
  Search,
} from 'lucide-react';
import { CHECKPOINT_FLOW } from '../shared/types';
import type {
  BaggageRecord,
  CheckpointCode,
  FlightRecord,
  TrackingEventRecord,
  TrackingInputSource,
} from '../types';
import { api } from '../services/api';
import { StatusIndicator } from './StatusIndicator';

export function QRScanStation({
  initialBagId,
  onScanCompleted,
}: {
  initialBagId?: string;
  onScanCompleted?: (bag: BaggageRecord) => void;
}) {
  const [inputMode, setInputMode] = useState<'camera' | 'manual' | 'rfid'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cameraError, setCameraError] = useState('');
  const [lookupInput, setLookupInput] = useState(initialBagId ?? '');
  const [loadingBag, setLoadingBag] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const [bagData, setBagData] = useState<{
    baggage: BaggageRecord;
    flight: FlightRecord | null;
    events: TrackingEventRecord[];
  } | null>(null);

  const [checkpointCode, setCheckpointCode] = useState<CheckpointCode>('SECURITY_SCREENING');
  const [location, setLocation] = useState('');
  const [statusOverride, setStatusOverride] = useState('');
  const [notes, setNotes] = useState('');
  const [allowOutOfOrder, setAllowOutOfOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState('');
  const [scanError, setScanError] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (initialBagId) {
      setLookupInput(initialBagId);
      handleLookup(initialBagId);
    }
  }, [initialBagId]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const scanner = new Html5Qrcode('skytrace-scan-station-viewport');
      scannerRef.current = scanner;
      setCameraActive(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          setLookupInput(decodedText);
          await stopCamera();
          await handleLookup(decodedText);
        },
        () => {}
      );
      setCameraPermission('granted');
    } catch (err) {
      setCameraActive(false);
      setCameraPermission('denied');
      setCameraError(
        err instanceof Error
          ? `Camera unavailable (${err.message}). Use Manual Bag ID entry or RFID simulation.`
          : 'Camera permission denied. Use Manual Bag ID entry below.'
      );
    }
  };

  const handleLookup = async (rawValue?: string) => {
    const query = (rawValue ?? lookupInput).trim();
    if (!query) {
      setLookupError('Enter a Bag ID or scan a baggage QR tag.');
      return;
    }
    setLoadingBag(true);
    setLookupError('');
    setScanSuccess('');
    setScanError('');
    try {
      const res = await api.trackBaggage(query);
      setBagData({
        baggage: res.baggage,
        flight: res.flight,
        events: res.events,
      });

      const currIdx = CHECKPOINT_FLOW.findIndex(
        (c) => c.code === res.baggage.currentCheckpointCode
      );
      const nextCp =
        currIdx >= 0 && currIdx < CHECKPOINT_FLOW.length - 1
          ? CHECKPOINT_FLOW[currIdx + 1]
          : CHECKPOINT_FLOW[CHECKPOINT_FLOW.length - 1];
      setCheckpointCode(nextCp.code);
      setLocation(nextCp.defaultLocation);
      setStatusOverride('');
      setNotes('');
      setAllowOutOfOrder(false);
    } catch (err) {
      setBagData(null);
      setLookupError(err instanceof Error ? err.message : 'Baggage record not found.');
    } finally {
      setLoadingBag(false);
    }
  };

  const handleConfirmCheckpoint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bagData) return;

    setSubmitting(true);
    setScanError('');
    setScanSuccess('');

    const source: TrackingInputSource =
      inputMode === 'rfid' ? 'RFID_READER' : inputMode === 'camera' ? 'QR_SCAN' : 'MANUAL_STAFF';

    try {
      const res = await api.scanBaggage({
        bagIdOrPayload: bagData.baggage.bagId,
        checkpointCode,
        location,
        inputSource: source,
        notes,
        statusOverride: statusOverride
          ? (statusOverride as BaggageRecord['status'])
          : undefined,
        allowOutOfOrder,
      });
      setScanSuccess(
        `Verified ${res.event.checkpointName} (${source.replace('_', ' ')}) for ${res.baggage.bagId}.`
      );
      await handleLookup(res.baggage.bagId);
      onScanCompleted?.(res.baggage);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan confirmation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentIdx = bagData
    ? CHECKPOINT_FLOW.findIndex((c) => c.code === bagData.baggage.currentCheckpointCode)
    : -1;
  const previousEvent =
    bagData && bagData.events.length > 1 ? bagData.events[bagData.events.length - 2] : null;
  const currentStage = currentIdx >= 0 ? CHECKPOINT_FLOW[currentIdx] : null;
  const nextPermittedStage =
    currentIdx >= 0 && currentIdx < CHECKPOINT_FLOW.length - 1
      ? CHECKPOINT_FLOW[currentIdx + 1]
      : null;

  return (
    <div className="space-y-6">
      {/* Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#101B2D] border border-[#A8B6C7]/18">
          <button
            type="button"
            onClick={() => setInputMode('camera')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              inputMode === 'camera'
                ? 'bg-[#203650] text-[#54D6E8] border border-[#54D6E8]/35'
                : 'text-[#A8B6C7] hover:text-[#F3F5F7]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Camera Scan Station
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('manual');
              stopCamera();
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              inputMode === 'manual'
                ? 'bg-[#203650] text-[#54D6E8] border border-[#54D6E8]/35'
                : 'text-[#A8B6C7] hover:text-[#F3F5F7]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Manual Bag ID
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('rfid');
              stopCamera();
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              inputMode === 'rfid'
                ? 'bg-[#203650] text-[#F0B85B] border border-[#F0B85B]/35'
                : 'text-[#A8B6C7] hover:text-[#F3F5F7]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            RFID Gate Simulation
          </button>
        </div>

        <div className="text-xs font-mono text-[#A8B6C7]">
          Camera Permission:{' '}
          <span
            className={
              cameraPermission === 'granted'
                ? 'text-[#52C7A5]'
                : cameraPermission === 'denied'
                ? 'text-[#E87583]'
                : 'text-[#54D6E8]'
            }
          >
            {cameraPermission === 'granted'
              ? 'Granted'
              : cameraPermission === 'denied'
              ? 'Unavailable / Denied'
              : 'Standby'}
          </span>
        </div>
      </div>

      {/* Central Full-Stage Scan Viewport + Identification Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Dedicated Camera / Manual / RFID Stage */}
        <div className="xl:col-span-6 rounded-2xl border border-[#A8B6C7]/18 bg-[#101B2D] p-6 space-y-5">
          {inputMode === 'camera' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#F3F5F7]">
                    Optical QR Scan Frame
                  </h3>
                  <p className="text-xs text-[#A8B6C7]">
                    Align baggage QR tag inside the reticle below.
                  </p>
                </div>
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ma-aurora text-[#101B2D] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
                  >
                    <Camera className="w-4 h-4" />
                    Activate Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E87583] text-[#101B2D] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <CameraOff className="w-4 h-4" />
                    Stop Camera
                  </button>
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden border border-[#54D6E8]/30 bg-[#0B1320] min-h-[260px] flex items-center justify-center">
                <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#54D6E8] pointer-events-none z-10" />
                <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#54D6E8] pointer-events-none z-10" />
                <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#54D6E8] pointer-events-none z-10" />
                <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#54D6E8] pointer-events-none z-10" />

                <div className="absolute top-4 inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-[#54D6E8] to-transparent animate-scan-beam pointer-events-none z-10" />

                <div
                  id="skytrace-scan-station-viewport"
                  className="w-full min-h-[250px] flex items-center justify-center text-xs text-[#A8B6C7]"
                >
                  {!cameraActive &&
                    'Camera scanner standby. Click "Activate Camera" or enter Bag ID below.'}
                </div>
              </div>

              {cameraError && (
                <div className="p-3 rounded-lg border border-[#F0B85B]/40 bg-[#F0B85B]/10 text-xs text-[#F0B85B] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {inputMode === 'rfid' && (
            <div className="p-5 rounded-xl border border-[#F0B85B]/35 bg-[#F0B85B]/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F0B85B]">
                <Radio className="w-4 h-4" />
                <span>RFID Gate Simulation Mode (No Physical Reader Attached)</span>
              </div>
              <p className="text-xs text-[#A8B6C7] leading-relaxed">
                Look up any Bag ID below to simulate an automated UHF RFID portal read (
                <code className="text-[#54D6E8]">RFID_READER</code>). Events persist identically to live hardware events.
              </p>
            </div>
          )}

          {/* Manual / Direct Lookup Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="space-y-3"
          >
            <label className="block text-xs font-medium text-[#A8B6C7]">
              Manual Bag ID / QR Payload Lookup
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#A8B6C7] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  placeholder="ST-2026-4810"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#A8B6C7]/25 bg-[#203650]/70 text-sm font-mono text-[#F3F5F7]"
                />
              </div>
              <button
                type="submit"
                disabled={loadingBag}
                className="px-4 py-2.5 rounded-lg bg-[#54D6E8] hover:bg-[#78E6D8] text-[#101B2D] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                {loadingBag ? 'Locating...' : 'Identify'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#A8B6C7]">
              <span>Quick test:</span>
              {['ST-2026-4810', 'ST-2026-4811', 'ST-2026-4815'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setLookupInput(id);
                    handleLookup(id);
                  }}
                  className="text-[#54D6E8] hover:underline cursor-pointer"
                >
                  {id}
                </button>
              ))}
            </div>
          </form>

          {lookupError && (
            <div className="p-3 rounded-lg border border-[#E87583]/40 bg-[#E87583]/10 text-xs text-[#E87583]">
              {lookupError}
            </div>
          )}
        </div>

        {/* Right: Baggage Identification & Next-Checkpoint Confirmation Panel */}
        <div className="xl:col-span-6 rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/55 p-6 space-y-5">
          {bagData ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#A8B6C7]/15 pb-4">
                <div>
                  <div className="text-[11px] font-mono text-[#C9A96E]">IDENTIFIED BAGGAGE</div>
                  <div className="text-2xl font-mono font-bold text-[#F3F5F7] tabular-nums">
                    {bagData.baggage.bagId}
                  </div>
                </div>
                <StatusIndicator status={bagData.baggage.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-[#A8B6C7]/15 bg-[#101B2D]/85 p-3.5">
                  <div className="text-[#A8B6C7]">Flight &amp; Passenger</div>
                  <div className="mt-1 font-mono font-semibold text-[#F3F5F7]">
                    {bagData.baggage.flightNumber} ({bagData.baggage.departureAirport} →{' '}
                    {bagData.baggage.arrivalAirport})
                  </div>
                  <div className="text-[#A8B6C7] mt-0.5">{bagData.baggage.passengerName}</div>
                </div>

                <div className="rounded-xl border border-[#A8B6C7]/15 bg-[#101B2D]/85 p-3.5">
                  <div className="text-[#A8B6C7]">Previous Checkpoint</div>
                  <div className="mt-1 font-semibold text-[#F3F5F7]">
                    {previousEvent ? previousEvent.checkpointName : 'Initial Check-in'}
                  </div>
                  <div className="text-[#A8B6C7] mt-0.5 truncate">
                    {previousEvent ? previousEvent.location : 'Origin Counter'}
                  </div>
                </div>

                <div className="rounded-xl border border-[#54D6E8]/30 bg-[#101B2D]/85 p-3.5">
                  <div className="text-[#54D6E8]">Current Checkpoint</div>
                  <div className="mt-1 font-semibold text-[#F3F5F7]">
                    {currentStage
                      ? `${currentStage.order}. ${currentStage.label}`
                      : bagData.baggage.currentCheckpointCode}
                  </div>
                  <div className="text-[#A8B6C7] mt-0.5 truncate">
                    {bagData.baggage.currentLocation}
                  </div>
                </div>

                <div className="rounded-xl border border-[#C9A96E]/40 bg-[#101B2D]/85 p-3.5">
                  <div className="text-[#C9A96E]">Next Permitted Checkpoint</div>
                  <div className="mt-1 font-semibold text-[#F3F5F7]">
                    {nextPermittedStage
                      ? `${nextPermittedStage.order}. ${nextPermittedStage.label}`
                      : 'Journey Complete'}
                  </div>
                  <div className="text-[#A8B6C7] mt-0.5 truncate">
                    {nextPermittedStage
                      ? nextPermittedStage.defaultLocation
                      : 'Final Delivery Verified'}
                  </div>
                </div>
              </div>

              {/* Checkpoint Progression Controls */}
              <form
                onSubmit={handleConfirmCheckpoint}
                className="space-y-4 pt-2 border-t border-[#A8B6C7]/15"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#A8B6C7] mb-1">
                      Checkpoint to Record
                    </label>
                    <select
                      value={checkpointCode}
                      onChange={(e) => {
                        const code = e.target.value as CheckpointCode;
                        setCheckpointCode(code);
                        const found = CHECKPOINT_FLOW.find((c) => c.code === code);
                        if (found) setLocation(found.defaultLocation);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#A8B6C7]/25 bg-[#101B2D] text-xs text-[#F3F5F7]"
                    >
                      {CHECKPOINT_FLOW.map((cp) => (
                        <option key={cp.code} value={cp.code}>
                          {cp.order}. {cp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#A8B6C7] mb-1">
                      Exception Override (Optional)
                    </label>
                    <select
                      value={statusOverride}
                      onChange={(e) => setStatusOverride(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#A8B6C7]/25 bg-[#101B2D] text-xs text-[#F3F5F7]"
                    >
                      <option value="">Nominal Progression</option>
                      <option value="delayed">Flag Delayed</option>
                      <option value="missing">Flag Missing</option>
                      <option value="damaged">Flag Damaged</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Checkpoint bay / gate location"
                    className="w-full px-3 py-2 rounded-lg border border-[#A8B6C7]/25 bg-[#101B2D] text-xs text-[#F3F5F7]"
                  />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Operational notes (optional)"
                    className="w-full px-3 py-2 rounded-lg border border-[#A8B6C7]/25 bg-[#101B2D] text-xs text-[#F3F5F7]"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-[#A8B6C7] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOutOfOrder}
                    onChange={(e) => setAllowOutOfOrder(e.target.checked)}
                    className="rounded border-[#A8B6C7]/35"
                  />
                  <span>Override sequence guard (logged as out-of-order re-route)</span>
                </label>

                {scanError && (
                  <div className="p-3 rounded-lg border border-[#E87583]/40 bg-[#E87583]/10 text-xs text-[#E87583]">
                    {scanError}
                  </div>
                )}
                {scanSuccess && (
                  <div className="p-3 rounded-lg border border-[#52C7A5]/40 bg-[#52C7A5]/10 text-xs text-[#52C7A5] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{scanSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-ma-aurora disabled:opacity-50 text-[#101B2D] text-xs font-bold tracking-wider cursor-pointer hover:opacity-95 transition-opacity"
                >
                  <span>{submitting ? 'RECORDING SCAN...' : 'CONFIRM NEXT CHECKPOINT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="py-16 text-center space-y-3 text-[#A8B6C7]">
              <Camera className="w-8 h-8 text-[#54D6E8] mx-auto opacity-85" />
              <div className="text-sm font-medium text-[#F3F5F7]">Scan Station Ready</div>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Scan a baggage QR code with your camera or enter a Bag ID to inspect its previous, current, and next permitted checkpoint.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
