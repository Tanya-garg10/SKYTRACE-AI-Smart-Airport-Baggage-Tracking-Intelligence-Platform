import { useState } from 'react';
import { motion } from 'motion/react';
import { Globe2 } from 'lucide-react';

interface Corridor {
  id: string;
  flight: string;
  from: { code: string; city: string; x: number; y: number };
  to: { code: string; city: string; x: number; y: number };
  status: string;
  bagsMonitored: number;
}

const CORRIDORS: Corridor[] = [
  {
    id: 'c1',
    flight: 'SK-402',
    from: { code: 'JFK', city: 'New York', x: 235, y: 128 },
    to: { code: 'LHR', city: 'London', x: 430, y: 102 },
    status: 'Boarding · Hold 2 Active',
    bagsMonitored: 2,
  },
  {
    id: 'c2',
    flight: 'SK-819',
    from: { code: 'LHR', city: 'London', x: 430, y: 102 },
    to: { code: 'SIN', city: 'Singapore', x: 705, y: 205 },
    status: 'Arrived · Carousel C-07',
    bagsMonitored: 2,
  },
  {
    id: 'c3',
    flight: 'SK-215',
    from: { code: 'SFO', city: 'San Francisco', x: 140, y: 140 },
    to: { code: 'HND', city: 'Tokyo', x: 780, y: 132 },
    status: 'Arrived · Carousel C-02',
    bagsMonitored: 2,
  },
  {
    id: 'c4',
    flight: 'SK-604',
    from: { code: 'DXB', city: 'Dubai', x: 565, y: 162 },
    to: { code: 'FRA', city: 'Frankfurt', x: 468, y: 112 },
    status: 'Transfer Hold Monitored',
    bagsMonitored: 1,
  },
  {
    id: 'c5',
    flight: 'SK-118',
    from: { code: 'ORD', city: 'Chicago', x: 200, y: 124 },
    to: { code: 'YYZ', city: 'Toronto', x: 245, y: 116 },
    status: 'Check-in Active',
    bagsMonitored: 1,
  },
];

export function AirportNetworkVisualization() {
  const [selected, setSelected] = useState<Corridor>(CORRIDORS[0]);

  return (
    <div className="rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/45 p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#54D6E8]">
          <Globe2 className="w-4 h-4" />
          <span>GLOBAL CORRIDOR TELEMETRY NETWORK (ILLUSTRATIVE)</span>
        </div>
        <div className="text-xs font-mono text-[#A8B6C7]">
          Selected: <span className="text-[#C9A96E]">{selected.flight}</span> · {selected.from.code} →{' '}
          {selected.to.code}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox="0 0 920 270" className="w-full min-w-[600px] h-auto">
          <ellipse
            cx="460"
            cy="135"
            rx="410"
            ry="110"
            fill="none"
            stroke="#A8B6C7"
            strokeOpacity="0.16"
            strokeDasharray="4 6"
          />
          <line x1="50" y1="135" x2="870" y2="135" stroke="#A8B6C7" strokeOpacity="0.12" />
          <line x1="460" y1="25" x2="460" y2="245" stroke="#A8B6C7" strokeOpacity="0.12" />

          {CORRIDORS.map((c) => {
            const isSelected = c.id === selected.id;
            const midX = (c.from.x + c.to.x) / 2;
            const midY = Math.min(c.from.y, c.to.y) - 42;
            const d = `M ${c.from.x} ${c.from.y} Q ${midX} ${midY} ${c.to.x} ${c.to.y}`;
            return (
              <g
                key={c.id}
                onClick={() => setSelected(c)}
                className="cursor-pointer"
              >
                <path
                  d={d}
                  fill="none"
                  stroke={isSelected ? '#54D6E8' : '#A8B6C7'}
                  strokeOpacity={isSelected ? 0.95 : 0.28}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {isSelected && (
                  <motion.circle
                    r="4"
                    fill="#C9A96E"
                    animate={{ offsetDistance: ['0%', '100%'] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ offsetPath: `path("${d}")` }}
                  />
                )}
              </g>
            );
          })}

          {CORRIDORS.flatMap((c) => [c.from, c.to]).map((hub, idx) => {
            const active =
              hub.code === selected.from.code || hub.code === selected.to.code;
            return (
              <g key={`${hub.code}-${idx}`}>
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r={active ? 6 : 4}
                  fill={active ? '#54D6E8' : '#A8B6C7'}
                  fillOpacity={active ? 1 : 0.55}
                />
                <text
                  x={hub.x}
                  y={hub.y + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    active ? 'fill-[#F3F5F7] font-bold' : 'fill-[#A8B6C7]'
                  }`}
                >
                  {hub.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#A8B6C7]/15 text-xs">
        <div className="flex flex-wrap gap-2">
          {CORRIDORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c)}
              className={`px-3 py-1.5 rounded-lg font-mono transition-colors cursor-pointer ${
                selected.id === c.id
                  ? 'bg-ma-aurora text-[#101B2D] font-bold'
                  : 'border border-[#A8B6C7]/20 text-[#A8B6C7] hover:text-[#F3F5F7]'
              }`}
            >
              {c.flight} ({c.from.code}→{c.to.code})
            </button>
          ))}
        </div>
        <div className="text-[#A8B6C7]">
          <span className="text-[#F3F5F7] font-medium">{selected.status}</span> ·{' '}
          <span className="font-mono tabular-nums text-[#C9A96E]">
            {selected.bagsMonitored} tracked bag(s)
          </span>
        </div>
      </div>
    </div>
  );
}
