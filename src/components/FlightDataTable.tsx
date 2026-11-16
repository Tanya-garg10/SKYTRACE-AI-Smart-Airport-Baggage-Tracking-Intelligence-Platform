import type { BaggageRecord } from '../types';
import { StatusIndicator } from './StatusIndicator';

export function FlightDataTable({
  bags,
  onScan,
  onQrCard,
}: {
  bags: BaggageRecord[];
  onScan?: (bagId: string) => void;
  onQrCard?: (bag: BaggageRecord) => void;
}) {
  if (bags.length === 0) {
    return (
      <div className="p-10 text-center text-xs text-[#A8B6C7]">
        No baggage records match your active search or flight filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[#A8B6C7]/15 text-[#A8B6C7]">
          <tr>
            <th className="py-3 px-4 font-medium">Bag ID</th>
            <th className="py-3 px-4 font-medium">Passenger</th>
            <th className="py-3 px-4 font-medium">Flight &amp; Route</th>
            <th className="py-3 px-4 font-medium">Weight</th>
            <th className="py-3 px-4 font-medium">Current Location</th>
            <th className="py-3 px-4 font-medium">Status</th>
            {(onScan || onQrCard) && (
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#A8B6C7]/10">
          {bags.map((b) => (
            <tr key={b.id} className="hover:bg-[#203650]/55 transition-colors">
              <td className="py-3 px-4 font-mono font-bold text-[#F3F5F7] tabular-nums whitespace-nowrap">
                {b.bagId}
              </td>
              <td className="py-3 px-4 text-[#F3F5F7] whitespace-nowrap">{b.passengerName}</td>
              <td className="py-3 px-4 font-mono text-[#54D6E8] whitespace-nowrap">
                {b.flightNumber} ({b.departureAirport}→{b.arrivalAirport})
              </td>
              <td className="py-3 px-4 font-mono tabular-nums text-[#A8B6C7] whitespace-nowrap">
                {b.weightKg} kg
              </td>
              <td className="py-3 px-4 text-[#A8B6C7] max-w-xs truncate">{b.currentLocation}</td>
              <td className="py-3 px-4">
                <StatusIndicator status={b.status} />
              </td>
              {(onScan || onQrCard) && (
                <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                  {onScan && (
                    <button
                      type="button"
                      onClick={() => onScan(b.bagId)}
                      className="px-2.5 py-1 rounded bg-[#54D6E8] hover:bg-[#78E6D8] text-[#101B2D] font-bold cursor-pointer"
                    >
                      Scan
                    </button>
                  )}
                  {onQrCard && (
                    <button
                      type="button"
                      onClick={() => onQrCard(b)}
                      className="px-2.5 py-1 rounded border border-[#A8B6C7]/25 hover:border-[#54D6E8] text-[#F3F5F7] cursor-pointer"
                    >
                      QR Card
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
