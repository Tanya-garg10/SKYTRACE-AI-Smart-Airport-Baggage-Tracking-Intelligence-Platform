import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

export function OperationalAlert({
  severity,
  title,
  message,
  meta,
  actionLabel,
  onAction,
}: {
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = {
    info: {
      wrap: 'border-[#54D6E8]/30 bg-[#203650]/65 text-[#F3F5F7]',
      icon: 'text-[#54D6E8]',
      Icon: Info,
    },
    success: {
      wrap: 'border-[#52C7A5]/35 bg-[#52C7A5]/10 text-[#F3F5F7]',
      icon: 'text-[#52C7A5]',
      Icon: CheckCircle2,
    },
    warning: {
      wrap: 'border-[#F0B85B]/40 bg-[#F0B85B]/10 text-[#F3F5F7]',
      icon: 'text-[#F0B85B]',
      Icon: AlertTriangle,
    },
    critical: {
      wrap: 'border-[#E87583]/45 bg-[#E87583]/10 text-[#F3F5F7]',
      icon: 'text-[#E87583]',
      Icon: ShieldAlert,
    },
  }[severity];

  const Icon = styles.Icon;

  return (
    <div className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${styles.wrap}`}>
      <div className="flex items-start gap-3 min-w-0">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${styles.icon}`} />
        <div className="min-w-0 space-y-1">
          <div className="text-xs font-semibold text-[#F3F5F7]">{title}</div>
          <p className="text-xs text-[#A8B6C7] leading-relaxed">{message}</p>
          {meta && <div className="text-[11px] font-mono text-[#A8B6C7]">{meta}</div>}
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-3 py-1.5 rounded-lg border border-[#A8B6C7]/25 hover:border-[#54D6E8] text-xs font-medium text-[#F3F5F7] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
