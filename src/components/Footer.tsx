import type { AppView } from './Navbar';

export function Footer({ onNavigate }: { onNavigate: (view: AppView, anchor?: string) => void }) {
  return (
    <footer className="border-t border-[#A8B6C7]/15 bg-[#101B2D] text-[#A8B6C7]">
      <div className="h-[1px] bg-ma-gold opacity-35" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="font-display text-lg font-bold text-[#F3F5F7]">
              SKYTRACE <span className="text-[#C9A96E]">AI</span>
            </div>
            <p className="text-sm max-w-md leading-relaxed">
              Every Bag. Every Journey. Always in Sight. Precision airport baggage telemetry connecting passengers, ground operations, and AI-assisted command centers.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="font-semibold text-[#F3F5F7]">Chapters</div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('landing', 'chapter-problem')}
                className="text-left hover:text-[#54D6E8] transition-colors cursor-pointer"
              >
                01. The Problem
              </button>
              <button
                type="button"
                onClick={() => onNavigate('landing', 'chapter-checkpoints')}
                className="text-left hover:text-[#54D6E8] transition-colors cursor-pointer"
              >
                03. Checkpoint Network
              </button>
              <button
                type="button"
                onClick={() => onNavigate('landing', 'chapter-tracking')}
                className="text-left hover:text-[#54D6E8] transition-colors cursor-pointer"
              >
                06. Live Bag Tracking
              </button>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="font-semibold text-[#F3F5F7]">Portals</div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="text-left hover:text-[#54D6E8] transition-colors cursor-pointer"
              >
                Passenger Concierge Login
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="text-left hover:text-[#54D6E8] transition-colors cursor-pointer"
              >
                Staff Control Station
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="text-left hover:text-[#54D6E8] transition-colors cursor-pointer"
              >
                Admin Digital Twin
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#A8B6C7]/15 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span>© 2026 SKYTRACE AI Aviation Systems</span>
          <span className="font-mono text-[#C9A96E]">
            QR Telemetry · RFID-Ready · Grounded Delay Intelligence
          </span>
        </div>
      </div>
    </footer>
  );
}
