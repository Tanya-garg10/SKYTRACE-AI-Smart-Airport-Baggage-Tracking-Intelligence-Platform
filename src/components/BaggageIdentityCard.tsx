import { QrCode } from 'lucide-react';
import type { BaggageRecord } from '../types';
import { StatusIndicator } from './StatusIndicator';

export function BaggageIdentityCard({
  baggage,
  selected,
  onSelect,
  onViewQr,
  lightSurface = false,
}: {
  baggage: BaggageRecord;
  selected?: boolean;
  onSelect: () => void;
  onViewQr?: () => void;
  lightSurface?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border p-4 transition-all cursor-pointer ${
        lightSurface
          ? selected
            ? 'border-[#157A8C] bg-[#F3F5F7]'
            : 'border-[#101B2D]/12 bg-white hover:border-[#101B2D]/30'
          : selected
          ? 'border-[#54D6E8] bg-[#203650]'
          : 'border-[#A8B6C7]/18 bg-[#203650]/45 hover:border-[#54D6E8]/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-mono text-sm font-bold tabular-nums ${
            lightSurface ? 'text-[#101B2D]' : 'text-[#F3F5F7]'
          }`}
        >
          {baggage.bagId}
        </span>
        <StatusIndicator status={baggage.status} lightSurface={lightSurface} />
      </div>

      <div
        className={`mt-1.5 flex items-center gap-2 text-xs ${
          lightSurface ? 'text-[#203650]/80' : 'text-[#A8B6C7]'
        }`}
      >
        <span className="font-mono font-medium">{baggage.flightNumber}</span>
        <span aria-hidden="true">·</span>
        <span>
          {baggage.departureAirport} → {baggage.arrivalAirport}
        </span>
        <span aria-hidden="true">·</span>
        <span>{baggage.weightKg} kg</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className={`text-xs truncate ${
            lightSurface ? 'text-[#203650]/65' : 'text-[#A8B6C7]'
          }`}
        >
          {baggage.currentLocation}
        </span>
        {onViewQr && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewQr();
            }}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 cursor-pointer ${
              lightSurface
                ? 'text-[#157A8C] hover:underline'
                : 'text-[#54D6E8] hover:underline'
            }`}
          >
            <QrCode className="w-3 h-3" />
            QR Tag
          </button>
        )}
      </div>
    </div>
  );
}
