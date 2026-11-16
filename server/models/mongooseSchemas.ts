import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['passenger', 'staff', 'admin'], required: true, index: true },
  active: { type: Boolean, default: true },
  createdAt: { type: String, required: true },
});

const PassengerSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, default: '' },
  passportLast4: { type: String, default: '' },
  frequentFlyerTier: { type: String, default: 'Standard' },
  createdAt: { type: String, required: true },
});

const StaffSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  assignedTerminal: { type: String, required: true },
  assignedFlightIds: { type: [String], default: [] },
  shiftStatus: { type: String, enum: ['on_duty', 'off_duty', 'break'], default: 'on_duty' },
  createdAt: { type: String, required: true },
});

const FlightSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  flightNumber: { type: String, required: true, unique: true, index: true },
  airline: { type: String, required: true },
  departureAirport: { type: String, required: true },
  arrivalAirport: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  gate: { type: String, required: true },
  carousel: { type: String, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'boarding', 'departed', 'in_flight', 'arrived', 'delayed'],
    default: 'scheduled',
  },
  createdAt: { type: String, required: true },
});

const BaggageSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  bagId: { type: String, required: true, unique: true, index: true },
  qrPayload: { type: String, required: true },
  rfidEpc: { type: String, required: true, index: true },
  passengerId: { type: String, required: true, index: true },
  passengerName: { type: String, required: true },
  passengerEmail: { type: String, required: true, index: true },
  flightId: { type: String, required: true, index: true },
  flightNumber: { type: String, required: true, index: true },
  departureAirport: { type: String, required: true },
  arrivalAirport: { type: String, required: true },
  baggageType: { type: String, required: true },
  color: { type: String, required: true },
  weightKg: { type: Number, required: true },
  specialHandling: { type: String, default: 'Standard' },
  currentCheckpointCode: { type: String, required: true },
  currentLocation: { type: String, required: true },
  status: { type: String, required: true, index: true },
  expectedDelivery: { type: String, required: true },
  checkInTime: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

const TrackingEventSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  bagId: { type: String, required: true, index: true },
  baggageId: { type: String, required: true, index: true },
  flightNumber: { type: String, required: true, index: true },
  checkpointCode: { type: String, required: true },
  checkpointName: { type: String, required: true },
  location: { type: String, required: true },
  statusAfter: { type: String, required: true },
  inputSource: { type: String, enum: ['QR_SCAN', 'RFID_READER', 'MANUAL_STAFF'], required: true },
  scannedByUserId: { type: String, required: true },
  scannedByName: { type: String, required: true },
  notes: { type: String, default: '' },
  timestamp: { type: String, required: true, index: true },
});

const NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: null, index: true },
  targetRole: { type: String, enum: ['passenger', 'staff', 'admin', 'all'], default: 'all' },
  bagId: { type: String, default: null },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['info', 'success', 'warning', 'alert'], default: 'info' },
  readByUserIds: { type: [String], default: [] },
  createdAt: { type: String, required: true, index: true },
});

const LostBaggageReportSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  bagId: { type: String, required: true, index: true },
  flightNumber: { type: String, required: true },
  passengerId: { type: String, required: true, index: true },
  passengerName: { type: String, required: true },
  passengerEmail: { type: String, required: true },
  description: { type: String, required: true },
  color: { type: String, required: true },
  baggageType: { type: String, required: true },
  lastKnownLocation: { type: String, required: true },
  issueCategory: { type: String, enum: ['missing', 'damaged', 'delayed_connection', 'tampered'], required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['open', 'investigating', 'resolved', 'closed'], default: 'open', index: true },
  resolutionNotes: { type: String, default: '' },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

const AirportCheckpointSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sequenceOrder: { type: Number, required: true },
  terminal: { type: String, required: true },
  zone: { type: String, required: true },
  rfidGateId: { type: String, required: true },
  active: { type: Boolean, default: true },
  avgDwellMinutes: { type: Number, default: 10 },
});

const StaffActivitySchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  staffUserId: { type: String, required: true, index: true },
  staffName: { type: String, required: true },
  action: { type: String, required: true },
  bagId: { type: String, default: null },
  details: { type: String, required: true },
  timestamp: { type: String, required: true, index: true },
});

export const MongoModels = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Passenger: mongoose.models.Passenger || mongoose.model('Passenger', PassengerSchema),
  Staff: mongoose.models.Staff || mongoose.model('Staff', StaffSchema),
  Flight: mongoose.models.Flight || mongoose.model('Flight', FlightSchema),
  Baggage: mongoose.models.Baggage || mongoose.model('Baggage', BaggageSchema),
  TrackingEvent: mongoose.models.TrackingEvent || mongoose.model('TrackingEvent', TrackingEventSchema),
  Notification: mongoose.models.Notification || mongoose.model('Notification', NotificationSchema),
  LostBaggageReport: mongoose.models.LostBaggageReport || mongoose.model('LostBaggageReport', LostBaggageReportSchema),
  AirportCheckpoint: mongoose.models.AirportCheckpoint || mongoose.model('AirportCheckpoint', AirportCheckpointSchema),
  StaffActivity: mongoose.models.StaffActivity || mongoose.model('StaffActivity', StaffActivitySchema),
};
