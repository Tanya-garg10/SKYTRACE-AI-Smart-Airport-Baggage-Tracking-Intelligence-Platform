import { Plane } from 'lucide-react';
import type { BaggageRecord, FlightRecord } from '../types';

export function DigitalBoardingPass({
  passengerName,
  flight,
  primaryBag,
  totalBags,
}: {
  passengerName: string;
  flight: FlightRecord | null;
  primaryBag: BaggageRecord | null;
  totalBags: number;
}) {
  const flightNum = flight?.flightNumber ?? primaryBag?.flightNumber ?? 'SK-402';
  const dep = flight?.departureAirport ?? primaryBag?.departureAirport ?? 'JFK';
  const arr = flight?.arrivalAirport ?? primaryBag?.arrivalAirport ?? 'LHR';
  const airline = flight?.airline ?? 'SkyTrace Airways';
  const gate = flight?.gate ?? 'T4-B22';
  const carousel = flight?.carousel ?? 'C-04';
  const status = flight?.status ?? 'scheduled';

  return (
    <div className="rounded-2xl border border-[#101B2D]/12 bg-white shadow-xs overflow-hidden">
      {/* Luxury Flight Ticket Header */}
      <div className="bg-[#101B2D] text-[#F3F5F7] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Plane className="w-4 h-4 text-[#54D6E8]" />
          <span className="text-xs font-mono tracking-wider text-[#C9A96E]">
            {airline.toUpperCase()} · LUXURY CONCIERGE PASS
          </span>
        </div>
        <span className="text-xs font-mono uppercase text-[#54D6E8] font-semibold">
          Flight {status.replace('_', ' ')}
        </span>
      </div>
      <div className="h-[2px] bg-ma-gold opacity-85" />

      {/* Ticket Body */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white">
        <div className="md:col-span-5 flex items-center gap-6">
          <div>
            <div className="text-xs text-[#203650]/70">Origin</div>
            <div className="font-display text-3xl font-bold text-[#101B2D] tracking-tight">
              {dep}
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#101B2D]/20" />
            <Plane className="w-4 h-4 text-[#157A8C]" />
            <div className="h-px flex-1 bg-[#101B2D]/20" />
          </div>
          <div className="text-right">
            <div className="text-xs text-[#203650]/70">Destination</div>
            <div className="font-display text-3xl font-bold text-[#101B2D] tracking-tight">
              {arr}
            </div>
          </div>
        </div>

        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 md:border-l md:border-dashed md:border-[#101B2D]/15 md:pl-6 text-xs">
          <div>
            <div className="text-[#203650]/70">Passenger</div>
            <div className="mt-1 font-semibold text-[#101B2D] truncate">{passengerName}</div>
          </div>
          <div>
            <div className="text-[#203650]/70">Flight</div>
            <div className="mt-1 font-mono font-bold text-[#101B2D]">{flightNum}</div>
          </div>
          <div>
            <div className="text-[#203650]/70">Gate / Carousel</div>
            <div className="mt-1 font-mono font-semibold text-[#101B2D]">
              {gate} · {carousel}
            </div>
          </div>
          <div>
            <div className="text-[#203650]/70">Checked Bags</div>
            <div className="mt-1 font-mono font-bold text-[#157A8C] tabular-nums">
              {totalBags} Bag(s)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
