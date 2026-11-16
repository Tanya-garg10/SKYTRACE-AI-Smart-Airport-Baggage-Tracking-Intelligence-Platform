import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PackageCheck,
  Plane,
  Radio,
  SearchX,
  ShieldAlert,
} from 'lucide-react';
import type { BaggageStatus } from '../types';

const STATUS_META: Record<
  BaggageStatus,
  { label: string; colorClass: string; Icon: typeof CheckCircle2 }
> = {
  registered: {
    label: 'Registered',
    colorClass: 'text-[#A8B6C7]',
    Icon: PackageCheck,
  },
  in_transit: {
    label: 'In Transit',
    colorClass: 'text-[#54D6E8]',
    Icon: Radio,
  },
  loaded: {
    label: 'Aircraft Loaded',
    colorClass: 'text-[#C9A96E]',
    Icon: Plane,
  },
  arrived: {
    label: 'Arrived',
    colorClass: 'text-[#54D6E8]',
    Icon: Plane,
  },
  carousel: {
    label: 'At Carousel',
    colorClass: 'text-[#52C7A5]',
    Icon: CheckCircle2,
  },
  delivered: {
    label: 'Delivered',
    colorClass: 'text-[#52C7A5]',
    Icon: CheckCircle2,
  },
  delayed: {
    label: 'Delayed',
    colorClass: 'text-[#F0B85B]',
    Icon: Clock,
  },
  missing: {
    label: 'Missing',
    colorClass: 'text-[#E87583]',
    Icon: SearchX,
  },
  damaged: {
    label: 'Damaged',
    colorClass: 'text-[#E87583]',
    Icon: ShieldAlert,
  },
};

export function StatusIndicator({
  status,
  lightSurface = false,
}: {
  status: BaggageStatus;
  lightSurface?: boolean;
}) {
  const meta = STATUS_META[status] ?? {
    label: status,
    colorClass: 'text-[#A8B6C7]',
    Icon: AlertTriangle,
  };
  const Icon = meta.Icon;

  const lightColors: Record<BaggageStatus, string> = {
    registered: 'text-[#203650]',
    in_transit: 'text-[#157A8C]',
    loaded: 'text-[#9E7B3B]',
    arrived: 'text-[#157A8C]',
    carousel: 'text-[#1C7C61]',
    delivered: 'text-[#1C7C61]',
    delayed: 'text-[#A66A14]',
    missing: 'text-[#B33949]',
    damaged: 'text-[#B33949]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
        lightSurface ? lightColors[status] ?? 'text-[#101B2D]' : meta.colorClass
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
}
