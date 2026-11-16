import { Download, Printer, X } from 'lucide-react';
import type { BaggageRecord } from '../types';

export function QrCardModal({
  baggage,
  qrDataUrl,
  onClose,
}: {
  baggage: BaggageRecord;
  qrDataUrl: string;
  onClose: () => void;
}) {
  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 440;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#101B2D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#C9A96E';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    ctx.fillStyle = '#54D6E8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SKYTRACE AI · DIGITAL BAGGAGE TAG', 42, 62);

    ctx.fillStyle = '#F3F5F7';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(baggage.bagId, 42, 115);

    ctx.fillStyle = '#A8B6C7';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Passenger: ${baggage.passengerName}`, 42, 165);
    ctx.fillText(
      `Flight: ${baggage.flightNumber}  (${baggage.departureAirport} -> ${baggage.arrivalAirport})`,
      42,
      198
    );
    ctx.fillText(
      `Baggage: ${baggage.color} ${baggage.baggageType} · ${baggage.weightKg} kg`,
      42,
      231
    );
    ctx.fillText(`Handling: ${baggage.specialHandling}`, 42, 264);
    ctx.fillText(`RFID EPC: ${baggage.rfidEpc}`, 42, 305);

    ctx.fillStyle = '#C9A96E';
    ctx.font = '13px sans-serif';
    ctx.fillText('Every Bag. Every Journey. Always in Sight.', 42, 392);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(462, 86, 212, 212);
      ctx.drawImage(img, 470, 94, 196, 196);
      const link = document.createElement('a');
      link.download = `${baggage.bagId}-identification-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrDataUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101B2D]/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#C9A96E]/35 bg-[#203650] text-[#F3F5F7] shadow-2xl overflow-hidden">
        <div className="h-[2px] bg-ma-gold" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#A8B6C7]/15 no-print">
          <h3 className="text-base font-semibold text-[#F3F5F7]">
            Digital Baggage Identification Card
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A8B6C7] hover:text-[#F3F5F7] hover:bg-[#101B2D] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-[#A8B6C7]/20 bg-[#101B2D] p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2.5 flex-1">
                <div className="text-xs font-mono tracking-wider text-[#C9A96E]">
                  SKYTRACE AI · BAGGAGE IDENTITY
                </div>
                <div className="text-2xl font-mono font-bold text-[#F3F5F7] tabular-nums">
                  {baggage.bagId}
                </div>
                <div className="text-sm text-[#F3F5F7]/90 space-y-1">
                  <div>
                    <span className="text-[#A8B6C7]">Passenger:</span>{' '}
                    <span className="font-medium">{baggage.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-[#A8B6C7]">Route:</span>{' '}
                    <span className="font-mono font-medium text-[#54D6E8]">
                      {baggage.flightNumber} · {baggage.departureAirport} → {baggage.arrivalAirport}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A8B6C7]">Spec:</span>{' '}
                    <span>
                      {baggage.color} {baggage.baggageType} · {baggage.weightKg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A8B6C7]">Handling:</span>{' '}
                    <span>{baggage.specialHandling}</span>
                  </div>
                  <div className="text-xs font-mono text-[#A8B6C7] pt-1">
                    RFID EPC: {baggage.rfidEpc}
                  </div>
                </div>
              </div>

              <div className="shrink-0 bg-white p-2.5 rounded-xl border border-[#C9A96E]/40 self-center sm:self-auto">
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${baggage.bagId}`}
                  className="w-36 h-36 object-contain"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#A8B6C7]/25 text-xs font-medium text-[#F3F5F7] hover:border-[#54D6E8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Tag
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ma-aurora text-[#101B2D] text-xs font-bold hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Card PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
