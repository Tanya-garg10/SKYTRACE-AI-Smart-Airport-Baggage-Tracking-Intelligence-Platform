import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Layers,
  Package,
  PlaneLanding,
  PlaneTakeoff,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import type { CheckpointCode } from '../types';

export function getCheckpointIcon(code: CheckpointCode | string) {
  switch (code) {
    case 'CHECK_IN_COUNTER':
      return ClipboardCheck;
    case 'SECURITY_SCREENING':
      return ShieldCheck;
    case 'SORTING_AREA':
      return Layers;
    case 'LOADING_ZONE':
      return Truck;
    case 'AIRCRAFT_LOADING':
      return PlaneTakeoff;
    case 'ARRIVAL_HANDLING':
      return PlaneLanding;
    case 'BAGGAGE_CAROUSEL':
      return Package;
    case 'FINAL_DELIVERY':
      return CheckCircle2;
    default:
      return Clock;
  }
}

export function CheckpointNode({
  code,
  label,
  state,
  variant = 'dark',
  onClick,
}: {
  code: CheckpointCode | string;
  label: string;
  state: 'completed' | 'current' | 'alert' | 'pending';
  variant?: 'dark' | 'light';
  onClick?: () => void;
}) {
  const Icon = getCheckpointIcon(code);

  const ringClass =
    state === 'alert'
      ? 'border-[#F0B85B] bg-[#F0B85B]/15 text-[#F0B85B]'
      : state === 'current'
      ? variant === 'light'
        ? 'border-[#157A8C] bg-[#54D6E8]/20 text-[#101B2D] ring-4 ring-[#54D6E8]/25'
        : 'border-[#54D6E8] bg-[#54D6E8]/15 text-[#54D6E8] ring-4 ring-[#54D6E8]/20'
      : state === 'completed'
      ? variant === 'light'
        ? 'border-[#101B2D] bg-[#101B2D] text-[#F3F5F7]'
        : 'border-[#52C7A5]/70 bg-[#52C7A5]/15 text-[#52C7A5]'
      : variant === 'light'
      ? 'border-[#101B2D]/20 bg-white text-[#A8B6C7]'
      : 'border-[#A8B6C7]/20 bg-[#101B2D] text-[#A8B6C7]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group flex flex-col items-center gap-2 text-center ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-200 ${ringClass}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span
        className={`text-[11px] font-medium leading-tight max-w-[84px] ${
          state === 'current'
            ? variant === 'light'
              ? 'text-[#101B2D] font-bold'
              : 'text-[#54D6E8] font-semibold'
            : state === 'completed'
            ? variant === 'light'
              ? 'text-[#101B2D]'
              : 'text-[#F3F5F7]'
            : variant === 'light'
            ? 'text-[#203650]/65'
            : 'text-[#A8B6C7]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
