import { useState } from 'react';
import { motion } from 'motion/react';
import { CHECKPOINT_FLOW } from '../shared/types';
import type {
  AirportCheckpointRecord,
  BaggageRecord,
  CheckpointCode,
  LostBaggageReportRecord,
  StaffActivityRecord,
} from '../types';
import { StatusIndicator } from './StatusIndicator';

const ZONE_COORDS: Record<CheckpointCode, { x: number; y: number; zoneLabel: string }> = {
  CHECK_IN_COUNTER: { x: 85, y: 170, zoneLabel: 'Check-in Desk' },
  SECURITY_SCREENING: { x: 205, y: 105, zoneLabel: 'EDS Screening' },
  SORTING_AREA: { x: 335, y: 170, zoneLabel: 'Sorter Loop' },
  LOADING_ZONE: { x: 465, y: 105, zoneLabel: 'Makeup Pier' },
  AIRCRAFT_LOADING: { x: 595, y: 170, zoneLabel: 'Apron Stand' },
  ARRIVAL_HANDLING: { x: 720, y: 105, zoneLabel: 'Arrival Bay' },
  BAGGAGE_CAROUSEL: { x: 840, y: 170, zoneLabel: 'Claim Carousel' },
  FINAL_DELIVERY: { x: 950, y: 105, zoneLabel: 'Exit Gate' },
};

export function AirportDigitalTwin({
  bags,
  checkpoints,
  reports,
  activity,
}: {
  bags: BaggageRecord[];
  checkpoints: AirportCheckpointRecord[];
  reports: LostBaggageReportRecord[];
  activity: StaffActivityRecord[];
}) {
  const [selectedCode, setSelectedCode] = useState<CheckpointCode>('SORTING_AREA');

  const bagsAtSelected = bags.filter((b) => b.currentCheckpointCode === selectedCode);
  const delayedAtSelected = bagsAtSelected.filter((b) =>
    ['delayed', 'missing', 'damaged'].includes(b.status)
  );
  const pendingAtSelected = bagsAtSelected.filter(
    (b) => b.status === 'registered' || b.status === 'in_transit'
  );
  const selectedCheckpointMeta = checkpoints.find((c) => c.code === selectedCode);
  const selectedFlowDef = CHECKPOINT_FLOW.find((c) => c.code === selectedCode)!;

  const recentScansAtZone = activity
    .filter(
      (act) =>
        bagsAtSelected.some((b) => b.bagId === act.bagId) ||
        act.details.toLowerCase().includes(selectedFlowDef.label.toLowerCase())
    )
    .slice(0, 4);

  const incidentsAtZone = reports.filter((rep) =>
    bagsAtSelected.some((b) => b.bagId === rep.bagId)
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left: Interactive Airport Schematic */}
      <div className="xl:col-span-8 rounded-2xl border border-[#A8B6C7]/18 bg-[#101B2D] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#F3F5F7]">
              Airport Digital Twin — Baggage Flow Schematic
            </h3>
            <p className="text-xs text-[#A8B6C7]">
              Illustrative terminal schematic mapped to live database baggage states. Select any checkpoint node to inspect zone telemetry.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#C9A96E]">
            Illustrative Schematic · Live DB Counts
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 1030 260"
            className="w-full min-w-[760px] h-auto select-none"
            role="img"
            aria-label="Illustrative Airport Digital Twin Schematic"
          >
            {/* Zone Backdrops */}
            <rect
              x="25"
              y="28"
              width="495"
              height="205"
              rx="14"
              fill="#203650"
              fillOpacity="0.45"
              stroke="#A8B6C7"
              strokeOpacity="0.2"
            />
            <text x="42" y="50" className="fill-[#54D6E8] text-[10px] font-mono">
              DEPARTURE CONCOURSE &amp; AUTOMATED SORTING
            </text>

            <rect
              x="535"
              y="28"
              width="120"
              height="205"
              rx="14"
              fill="#C9A96E"
              fillOpacity="0.08"
              stroke="#C9A96E"
              strokeOpacity="0.35"
            />
            <text x="552" y="50" className="fill-[#C9A96E] text-[10px] font-mono">
              AIRSIDE RAMP
            </text>

            <rect
              x="670"
              y="28"
              width="335"
              height="205"
              rx="14"
              fill="#203650"
              fillOpacity="0.45"
              stroke="#A8B6C7"
              strokeOpacity="0.2"
            />
            <text x="688" y="50" className="fill-[#52C7A5] text-[10px] font-mono">
              ARRIVALS &amp; RECLAIM HALL
            </text>

            {/* Animated Conveyor Connections */}
            {CHECKPOINT_FLOW.slice(0, -1).map((cp, i) => {
              const from = ZONE_COORDS[cp.code];
              const to = ZONE_COORDS[CHECKPOINT_FLOW[i + 1].code];
              const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
              return (
                <g key={`path-${cp.code}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#54D6E8"
                    strokeOpacity="0.28"
                    strokeWidth="2"
                  />
                  <motion.circle
                    r="3"
                    fill="#54D6E8"
                    animate={{ offsetDistance: ['0%', '100%'] }}
                    transition={{
                      duration: 2.8,
                      delay: i * 0.25,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{ offsetPath: `path("${d}")` }}
                  />
                </g>
              );
            })}

            {/* Interactive Checkpoint Nodes */}
            {CHECKPOINT_FLOW.map((cp) => {
              const pos = ZONE_COORDS[cp.code];
              const count = bags.filter((b) => b.currentCheckpointCode === cp.code).length;
              const hasIssue = bags.some(
                (b) =>
                  b.currentCheckpointCode === cp.code &&
                  ['delayed', 'missing', 'damaged'].includes(b.status)
              );
              const isSelected = selectedCode === cp.code;

              return (
                <g
                  key={cp.code}
                  onClick={() => setSelectedCode(cp.code)}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="26"
                      fill="none"
                      stroke="#54D6E8"
                      strokeOpacity="0.65"
                      strokeWidth="2"
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="18"
                    fill={hasIssue ? '#F0B85B' : isSelected ? '#54D6E8' : '#203650'}
                    stroke={isSelected ? '#F3F5F7' : '#A8B6C7'}
                    strokeOpacity={isSelected ? 1 : 0.45}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    className={`text-[11px] font-mono font-bold pointer-events-none ${
                      hasIssue || isSelected ? 'fill-[#101B2D]' : 'fill-[#F3F5F7]'
                    }`}
                  >
                    {count}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 34}
                    textAnchor="middle"
                    className={`text-[10px] font-medium pointer-events-none ${
                      isSelected ? 'fill-[#54D6E8] font-semibold' : 'fill-[#A8B6C7]'
                    }`}
                  >
                    {pos.zoneLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#A8B6C7]/15 text-xs text-[#A8B6C7]">
          <div>Node numbers indicate current bags stationed at each checkpoint.</div>
          <div className="flex items-center gap-4 font-mono">
            <span className="text-[#54D6E8]">Selected Zone</span>
            <span className="text-[#F0B85B]">Zone With Delayed/Missing Bag</span>
          </div>
        </div>
      </div>

      {/* Right: Selected Checkpoint Telemetry Inspector */}
      <div className="xl:col-span-4 rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/65 p-5 space-y-5">
        <div className="border-b border-[#A8B6C7]/15 pb-3">
          <div className="text-[11px] font-mono text-[#C9A96E]">
            CHECKPOINT {selectedFlowDef.order} OF 8 · {selectedCheckpointMeta?.rfidGateId ?? 'RFID-GATE'}
          </div>
          <h4 className="mt-1 text-lg font-semibold text-[#F3F5F7]">{selectedFlowDef.label}</h4>
          <p className="text-xs text-[#A8B6C7] mt-0.5">
            {selectedCheckpointMeta?.zone ?? selectedFlowDef.defaultLocation}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-[#A8B6C7]/15 bg-[#101B2D]/85 p-3">
            <div className="text-[#A8B6C7]">Baggage At Zone</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-[#F3F5F7]">
              {bagsAtSelected.length}
            </div>
          </div>
          <div className="rounded-xl border border-[#A8B6C7]/15 bg-[#101B2D]/85 p-3">
            <div className="text-[#A8B6C7]">Pending / Processing</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-[#54D6E8]">
              {pendingAtSelected.length}
            </div>
          </div>
          <div className="rounded-xl border border-[#A8B6C7]/15 bg-[#101B2D]/85 p-3">
            <div className="text-[#A8B6C7]">Delayed / Exceptions</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-[#F0B85B]">
              {delayedAtSelected.length}
            </div>
          </div>
          <div className="rounded-xl border border-[#A8B6C7]/15 bg-[#101B2D]/85 p-3">
            <div className="text-[#A8B6C7]">Active Incidents</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-[#E87583]">
              {incidentsAtZone.length}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#F3F5F7]">
            Bags Currently Stationed Here
          </div>
          {bagsAtSelected.length === 0 ? (
            <div className="text-xs text-[#A8B6C7] py-2">
              No bags currently stationed at this checkpoint.
            </div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {bagsAtSelected.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-lg border border-[#A8B6C7]/15 bg-[#101B2D]/75 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-[#F3F5F7]">{b.bagId}</div>
                    <div className="text-[#A8B6C7]">
                      {b.flightNumber} · {b.passengerName}
                    </div>
                  </div>
                  <StatusIndicator status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t border-[#A8B6C7]/15">
          <div className="text-xs font-semibold text-[#F3F5F7]">Recent Zone Activity</div>
          {recentScansAtZone.length === 0 ? (
            <div className="text-xs text-[#A8B6C7]">No recent activity logs for this zone.</div>
          ) : (
            <div className="space-y-1.5 text-xs text-[#A8B6C7]">
              {recentScansAtZone.map((act) => (
                <div key={act.id} className="truncate">
                  <span className="font-mono text-[#54D6E8]">{act.bagId ?? 'SYS'}</span> ·{' '}
                  {act.details}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
