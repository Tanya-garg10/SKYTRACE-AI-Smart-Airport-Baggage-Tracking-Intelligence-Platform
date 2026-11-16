import { Activity } from 'lucide-react';
import type { StaffActivityRecord } from '../types';

export function LiveActivityFeed({
  activity,
  limit = 10,
}: {
  activity: StaffActivityRecord[];
  limit?: number;
}) {
  const items = activity.slice(0, limit);

  return (
    <div className="rounded-2xl border border-[#A8B6C7]/18 bg-[#101B2D] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#A8B6C7]/15 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#54D6E8]" />
          <h4 className="text-sm font-semibold text-[#F3F5F7]">
            Live Checkpoint &amp; Operator Feed
          </h4>
        </div>
        <span className="text-[11px] font-mono text-[#C9A96E]">REAL-TIME LOGS</span>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center text-xs text-[#A8B6C7]">
          No recent checkpoint or operator events recorded.
        </div>
      ) : (
        <div className="divide-y divide-[#A8B6C7]/10">
          {items.map((act) => (
            <div key={act.id} className="px-5 py-3 flex items-start justify-between gap-4 text-xs">
              <div className="min-w-0 space-y-0.5">
                <div className="font-medium text-[#F3F5F7]">
                  {act.staffName}{' '}
                  <span className="font-mono text-[11px] text-[#54D6E8] ml-1.5">
                    {act.action}
                  </span>
                  {act.bagId && (
                    <span className="font-mono text-[11px] text-[#C9A96E] ml-1.5">
                      {act.bagId}
                    </span>
                  )}
                </div>
                <div className="text-[#A8B6C7] truncate">{act.details}</div>
              </div>
              <time className="font-mono tabular-nums text-[11px] text-[#A8B6C7] shrink-0">
                {new Date(act.timestamp).toLocaleTimeString([], {
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
