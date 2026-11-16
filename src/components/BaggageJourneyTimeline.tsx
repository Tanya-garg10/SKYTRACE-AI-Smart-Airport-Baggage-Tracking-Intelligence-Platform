import { useState } from 'react';
import { motion } from 'motion/react';
import { Luggage, QrCode, Radio, UserCheck } from 'lucide-react';
import { CHECKPOINT_FLOW } from '../shared/types';
import type { DemoTrackingEvent, TrackingEventRecord } from '../types';
import { CheckpointNode } from './CheckpointNode';

type TimelineEvent = Pick<
  TrackingEventRecord,
  'id' | 'checkpointCode' | 'checkpointName' | 'location' | 'statusAfter' | 'inputSource' | 'timestamp'
> & {
  scannedByName?: string;
  notes?: string;
};

export function BaggageJourneyTimeline({
  events,
  bagStatus,
  currentCheckpointCode,
  variant = 'light',
}: {
  events: (TimelineEvent | DemoTrackingEvent)[];
  bagStatus: string;
  currentCheckpointCode?: string;
  variant?: 'light' | 'dark';
}) {
  const eventsByCode = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    const arr = eventsByCode.get(ev.checkpointCode) ?? [];
    arr.push(ev);
    eventsByCode.set(ev.checkpointCode, arr);
  }

  const latestRecordedCode =
    currentCheckpointCode ??
    events[events.length - 1]?.checkpointCode ??
    'CHECK_IN_COUNTER';

  const [inspectedCode, setInspectedCode] = useState<string>(latestRecordedCode);

  const currentIdx = Math.max(
    0,
    CHECKPOINT_FLOW.findIndex((c) => c.code === latestRecordedCode)
  );
  const progressPercent = (currentIdx / (CHECKPOINT_FLOW.length - 1)) * 100;

  const inspectedStage =
    CHECKPOINT_FLOW.find((c) => c.code === inspectedCode) ?? CHECKPOINT_FLOW[currentIdx];
  const inspectedEvents = eventsByCode.get(inspectedStage.code) ?? [];
  const inspectedLatest = inspectedEvents[inspectedEvents.length - 1];

  const isLight = variant === 'light';

  const formatSource = (src: string) => {
    if (src === 'RFID_READER') return { label: 'RFID Gate', Icon: Radio };
    if (src === 'MANUAL_STAFF') return { label: 'Staff Entry', Icon: UserCheck };
    return { label: 'QR Scan', Icon: QrCode };
  };

  return (
    <div className="space-y-6">
      {/* Horizontal Illuminated Route Track */}
      <div
        className={`rounded-2xl border p-6 overflow-x-auto ${
          isLight
            ? 'border-[#101B2D]/12 bg-white'
            : 'border-[#A8B6C7]/18 bg-[#203650]/45'
        }`}
      >
        <div className="min-w-[680px]">
          {/* Animated Traveling Suitcase Indicator */}
          <div className="relative h-8 mb-3 mx-8">
            <div
              className={`absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 ${
                isLight ? 'bg-[#E2E7EE]' : 'bg-[#A8B6C7]/20'
              }`}
            />
            <motion.div
              className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-ma-aurora"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
              initial={{ left: '0%' }}
              animate={{ left: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  bagStatus === 'delayed' || bagStatus === 'missing' || bagStatus === 'damaged'
                    ? 'bg-[#F0B85B] text-[#101B2D]'
                    : 'bg-ma-aurora text-[#101B2D]'
                }`}
              >
                <Luggage className="w-4 h-4" />
              </div>
            </motion.div>
          </div>

          {/* 8 Checkpoint Nodes */}
          <div className="grid grid-cols-8 gap-2">
            {CHECKPOINT_FLOW.map((cp, idx) => {
              const hasEvent = eventsByCode.has(cp.code);
              const isCurrent = cp.code === latestRecordedCode;
              const isAlert =
                isCurrent &&
                (bagStatus === 'delayed' || bagStatus === 'missing' || bagStatus === 'damaged');
              const state: 'completed' | 'current' | 'alert' | 'pending' = isAlert
                ? 'alert'
                : isCurrent
                ? 'current'
                : hasEvent || idx < currentIdx
                ? 'completed'
                : 'pending';

              return (
                <CheckpointNode
                  key={cp.code}
                  code={cp.code}
                  label={cp.journeyLabel}
                  state={state}
                  variant={variant}
                  onClick={() => setInspectedCode(cp.code)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Inspected Checkpoint Detail Strip */}
      <div
        className={`rounded-xl border p-5 ${
          isLight
            ? 'border-[#101B2D]/12 bg-white text-[#101B2D]'
            : 'border-[#A8B6C7]/18 bg-[#101B2D]/90 text-[#F3F5F7]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold">
            {inspectedStage.order}. {inspectedStage.journeyLabel}
          </div>
          {inspectedLatest ? (
            <time
              className={`text-xs font-mono tabular-nums ${
                isLight ? 'text-[#9E7B3B]' : 'text-[#C9A96E]'
              }`}
            >
              {new Date(inspectedLatest.timestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          ) : (
            <span className={`text-xs ${isLight ? 'text-[#203650]/65' : 'text-[#A8B6C7]'}`}>
              Awaiting checkpoint verification
            </span>
          )}
        </div>

        {inspectedLatest ? (
          <div className="mt-2 space-y-1.5 text-xs">
            <div className={isLight ? 'text-[#203650]' : 'text-[#F3F5F7]'}>
              Location: <span className="font-medium">{inspectedLatest.location}</span>
            </div>
            <div
              className={`flex flex-wrap items-center gap-2 ${
                isLight ? 'text-[#203650]/75' : 'text-[#A8B6C7]'
              }`}
            >
              {(() => {
                const src = formatSource(inspectedLatest.inputSource);
                return (
                  <span className="inline-flex items-center gap-1">
                    <src.Icon
                      className={`w-3.5 h-3.5 ${isLight ? 'text-[#157A8C]' : 'text-[#54D6E8]'}`}
                    />
                    <span>{src.label}</span>
                  </span>
                );
              })()}
              <span aria-hidden="true">·</span>
              <span className="capitalize">
                Status: {inspectedLatest.statusAfter.replace('_', ' ')}
              </span>
              {'scannedByName' in inspectedLatest && inspectedLatest.scannedByName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Operator: {inspectedLatest.scannedByName}</span>
                </>
              )}
            </div>
            {'notes' in inspectedLatest && inspectedLatest.notes && (
              <p className={`italic ${isLight ? 'text-[#203650]/70' : 'text-[#A8B6C7]'}`}>
                {inspectedLatest.notes}
              </p>
            )}
          </div>
        ) : (
          <p className={`mt-1.5 text-xs ${isLight ? 'text-[#203650]/70' : 'text-[#A8B6C7]'}`}>
            No scan recorded at this checkpoint yet. Expected zone: {inspectedStage.defaultLocation}.
          </p>
        )}
      </div>

      {/* Compact Chronological Verification Ledger */}
      {events.length > 0 && (
        <div
          className={`rounded-xl border divide-y ${
            isLight
              ? 'border-[#101B2D]/12 bg-white divide-[#101B2D]/8'
              : 'border-[#A8B6C7]/18 bg-[#203650]/35 divide-[#A8B6C7]/10'
          }`}
        >
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setInspectedCode(ev.checkpointCode)}
              className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                isLight ? 'hover:bg-[#F3F5F7]' : 'hover:bg-[#203650]/65'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`font-mono font-semibold ${
                    isLight ? 'text-[#157A8C]' : 'text-[#54D6E8]'
                  }`}
                >
                  {ev.checkpointName}
                </span>
                <span className={isLight ? 'text-[#203650]/80' : 'text-[#A8B6C7]'}>
                  {ev.location}
                </span>
              </div>
              <time
                className={`font-mono tabular-nums ${
                  isLight ? 'text-[#203650]/70' : 'text-[#A8B6C7]'
                }`}
              >
                {new Date(ev.timestamp).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
