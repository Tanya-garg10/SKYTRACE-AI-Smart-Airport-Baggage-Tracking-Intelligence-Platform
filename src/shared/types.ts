export type UserRole = 'passenger' | 'staff' | 'admin';

export type BaggageStatus =
  | 'registered'
  | 'in_transit'
  | 'loaded'
  | 'arrived'
  | 'carousel'
  | 'delivered'
  | 'delayed'
  | 'missing'
  | 'damaged';

export type TrackingInputSource = 'QR_SCAN' | 'RFID_READER' | 'MANUAL_STAFF';

export type CheckpointCode =
  | 'CHECK_IN_COUNTER'
  | 'SECURITY_SCREENING'
  | 'SORTING_AREA'
  | 'LOADING_ZONE'
  | 'AIRCRAFT_LOADING'
  | 'ARRIVAL_HANDLING'
  | 'BAGGAGE_CAROUSEL'
  | 'FINAL_DELIVERY';

export const CHECKPOINT_FLOW: {
  code: CheckpointCode;
  label: string;
  journeyLabel: string;
  order: number;
  statusAfter: BaggageStatus;
  defaultLocation: string;
}[] = [
  {
    code: 'CHECK_IN_COUNTER',
    label: 'Check-in Counter',
    journeyLabel: 'Baggage Registered',
    order: 1,
    statusAfter: 'registered',
    defaultLocation: 'Terminal 1 · Check-in Desk B12',
  },
  {
    code: 'SECURITY_SCREENING',
    label: 'Security Screening',
    journeyLabel: 'Security Screening',
    order: 2,
    statusAfter: 'in_transit',
    defaultLocation: 'EDS Screening Bay S2',
  },
  {
    code: 'SORTING_AREA',
    label: 'Sorting Area',
    journeyLabel: 'Sorting Area',
    order: 3,
    statusAfter: 'in_transit',
    defaultLocation: 'Automated High-Speed Sorter Loop A',
  },
  {
    code: 'LOADING_ZONE',
    label: 'Loading Zone',
    journeyLabel: 'Loading Zone',
    order: 4,
    statusAfter: 'in_transit',
    defaultLocation: 'Airside Makeup Pier M4',
  },
  {
    code: 'AIRCRAFT_LOADING',
    label: 'Aircraft Loading',
    journeyLabel: 'Aircraft Loaded',
    order: 5,
    statusAfter: 'loaded',
    defaultLocation: 'Apron Stand & Cargo Hold',
  },
  {
    code: 'ARRIVAL_HANDLING',
    label: 'Arrival Handling',
    journeyLabel: 'Arrival Airport',
    order: 6,
    statusAfter: 'arrived',
    defaultLocation: 'Destination Inbound Transfer Bay',
  },
  {
    code: 'BAGGAGE_CAROUSEL',
    label: 'Baggage Carousel',
    journeyLabel: 'Baggage Carousel',
    order: 7,
    statusAfter: 'carousel',
    defaultLocation: 'Arrivals Hall Claim Carousel',
  },
  {
    code: 'FINAL_DELIVERY',
    label: 'Final Delivery',
    journeyLabel: 'Delivered',
    order: 8,
    statusAfter: 'delivered',
    defaultLocation: 'Passenger Exit Verification Gate',
  },
];

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface PassengerRecord {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  passportLast4: string;
  frequentFlyerTier: string;
  createdAt: string;
}

export interface StaffRecord {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  assignedTerminal: string;
  assignedFlightIds: string[];
  shiftStatus: 'on_duty' | 'off_duty' | 'break';
  createdAt: string;
}

export interface FlightRecord {
  id: string;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  gate: string;
  carousel: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'in_flight' | 'arrived' | 'delayed';
  createdAt: string;
}

export interface BaggageRecord {
  id: string;
  bagId: string;
  qrPayload: string;
  rfidEpc: string;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  flightId: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  baggageType: 'Hardshell' | 'Softshell' | 'Duffel' | 'Priority Case' | 'Oversized';
  color: string;
  weightKg: number;
  specialHandling: string;
  currentCheckpointCode: CheckpointCode;
  currentLocation: string;
  status: BaggageStatus;
  expectedDelivery: string;
  checkInTime: string;
  updatedAt: string;
}

export interface TrackingEventRecord {
  id: string;
  bagId: string;
  baggageId: string;
  flightNumber: string;
  checkpointCode: CheckpointCode;
  checkpointName: string;
  location: string;
  statusAfter: BaggageStatus;
  inputSource: TrackingInputSource;
  scannedByUserId: string;
  scannedByName: string;
  notes: string;
  timestamp: string;
}

export interface NotificationRecord {
  id: string;
  userId: string | null;
  targetRole: UserRole | 'all';
  bagId: string | null;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
  readByUserIds: string[];
  createdAt: string;
}

export interface LostBaggageReportRecord {
  id: string;
  bagId: string;
  flightNumber: string;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  description: string;
  color: string;
  baggageType: string;
  lastKnownLocation: string;
  issueCategory: 'missing' | 'damaged' | 'delayed_connection' | 'tampered';
  details: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AirportCheckpointRecord {
  id: string;
  code: CheckpointCode;
  name: string;
  sequenceOrder: number;
  terminal: string;
  zone: string;
  rfidGateId: string;
  active: boolean;
  avgDwellMinutes: number;
}

export interface StaffActivityRecord {
  id: string;
  staffUserId: string;
  staffName: string;
  action: string;
  bagId: string | null;
  details: string;
  timestamp: string;
}

export interface DelayRiskAssessment {
  bagId: string;
  flightNumber: string;
  passengerName: string;
  currentStatus: BaggageStatus;
  currentLocation: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  explanation: string;
  evidence: string[];
  recommendedAction: string;
  aiPowered: boolean;
}

export interface AnomalyDetectionItem {
  id: string;
  bagId: string;
  flightNumber: string;
  anomalyType:
    | 'DUPLICATE_SCAN'
    | 'SKIPPED_CHECKPOINT'
    | 'EXTENDED_DWELL'
    | 'OUT_OF_ORDER_SEQUENCE'
    | 'UNUSUAL_STATUS_TRANSITION';
  severity: 'Medium' | 'High';
  summary: string;
  evidence: string;
  detectedAt: string;
}
