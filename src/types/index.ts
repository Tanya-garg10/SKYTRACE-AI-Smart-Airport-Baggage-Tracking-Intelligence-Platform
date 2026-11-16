export * from '../shared/types';
import type {
  BaggageStatus,
  CheckpointCode,
  NotificationRecord,
  TrackingInputSource,
} from '../shared/types';

export interface ClientNotification extends NotificationRecord {
  read: boolean;
}

export interface PublicStats {
  totalBaggageTracked: number;
  activeFlights: number;
  activeCheckpoints: number;
  totalScanEvents: number;
  deliveredBaggage: number;
  inTransitBaggage: number;
  dbMode: string;
}

export interface DemoTrackingEvent {
  id: string;
  bagId: string;
  checkpointCode: CheckpointCode;
  checkpointName: string;
  location: string;
  statusAfter: BaggageStatus;
  inputSource: TrackingInputSource;
  timestamp: string;
}

export interface DemoSampleRecord {
  bagId: string;
  isDemoSample: boolean;
  passengerName: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  baggageType: string;
  color: string;
  weightKg: number;
  currentLocation: string;
  status: BaggageStatus;
  checkInTime: string;
  expectedDelivery: string;
  events: DemoTrackingEvent[];
}
