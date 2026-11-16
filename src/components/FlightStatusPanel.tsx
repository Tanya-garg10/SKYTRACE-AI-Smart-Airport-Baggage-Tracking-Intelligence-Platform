import { Plane } from 'lucide-react';
import type { BaggageRecord, FlightRecord } from '../types';

export function FlightStatusPanel({
  flights,
  bags,
  onSelectFlight,
}: {
  flights: FlightRecord[];
  bags: BaggageRecord[];
  onSelectFlight?: (flightNumber: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {flights.map((f) => {
        const flightBags = bags.filter((b) => b.flightNumber === f.flightNumber);
        const delayedCount = flightBags.filter((b) =>
          ['delayed', 'missing', 'damaged'].includes(b.status)
        ).length;

        return (
          <div
            key={f.id}
            onClick={() => onSelectFlight?.(f.flightNumber)}
            className={`rounded-xl border border-[#A8B6C7]/18 bg-[#203650]/55 p-4 space-y-2 transition-transform hover:-translate-y-0.5 ${
              onSelectFlight ? 'cursor-pointer hover:border-[#54D6E8]/55' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-3.5 h-3.5 text-[#54D6E8]" />
                <span className="font-mono text-sm font-bold text-[#F3F5F7]">
                  {f.flightNumber}
                </span>
              </div>
              <span
                className={`text-[11px] font-mono uppercase font-semibold ${
                  f.status === 'delayed'
                    ? 'text-[#F0B85B]'
                    : f.status === 'arrived'
                    ? 'text-[#52C7A5]'
                    : 'text-[#54D6E8]'
                }`}
              >
                {f.status.replace('_', ' ')}
              </span>
            </div>

            <div className="text-xs text-[#A8B6C7]">
              {f.departureAirport} → {f.arrivalAirport} · Gate {f.gate} · Carousel {f.carousel}
            </div>

            <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1.5 border-t border-[#A8B6C7]/15">
              <span className="text-[#F3F5F7]">{flightBags.length} tracked bag(s)</span>
              {delayedCount > 0 && (
                <span className="text-[#F0B85B]">{delayedCount} exception(s)</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
