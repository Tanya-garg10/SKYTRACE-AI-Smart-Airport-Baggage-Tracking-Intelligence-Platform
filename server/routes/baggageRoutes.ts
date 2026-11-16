import { Router } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import {
  BaggageRecord,
  BaggageStatus,
  CHECKPOINT_FLOW,
  CheckpointCode,
  TrackingInputSource,
} from '../../src/shared/types.js';
import { db } from '../db/database.js';
import {
  AuthenticatedRequest,
  HttpError,
  requireAuth,
  requireRole,
} from '../middleware/auth.js';
import {
  emitBaggageRegistered,
  emitBaggageScanned,
  emitNotification,
} from '../services/socketService.js';

const router = Router();

function parseBagIdFromInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { bagId?: string };
      if (parsed.bagId) return parsed.bagId.trim().toUpperCase();
    } catch {
      // fall through
    }
  }
  return trimmed.toUpperCase();
}

function getCheckpointDef(code: string) {
  return CHECKPOINT_FLOW.find((c) => c.code === code) ?? null;
}

router.get('/flights/list', requireAuth, async (_req, res, next) => {
  try {
    const flights = await db.getFlights();
    res.json({ success: true, flights });
  } catch (err) {
    next(err);
  }
});

router.get('/passengers/list', requireAuth, requireRole('staff', 'admin'), async (_req, res, next) => {
  try {
    const passengers = await db.getPassengers();
    res.json({ success: true, passengers });
  } catch (err) {
    next(err);
  }
});

router.get('/checkpoints/list', requireAuth, async (_req, res, next) => {
  try {
    const checkpoints = await db.getCheckpoints();
    res.json({
      success: true,
      checkpoints: checkpoints.sort((a, b) => a.sequenceOrder - b.sequenceOrder),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const [allBags, passengers] = await Promise.all([
      db.getBaggage(),
      db.getPassengers(),
    ]);

    const user = req.user!;
    let filtered = allBags;

    if (user.role === 'passenger') {
      const myPassenger = passengers.find((p) => p.userId === user.userId);
      filtered = allBags.filter(
        (b) =>
          b.passengerEmail.toLowerCase() === user.email.toLowerCase() ||
          (myPassenger && b.passengerId === myPassenger.id)
      );
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const flightNumber =
      typeof req.query.flightNumber === 'string' ? req.query.flightNumber.trim().toUpperCase() : '';

    if (search) {
      filtered = filtered.filter(
        (b) =>
          b.bagId.toLowerCase().includes(search) ||
          b.flightNumber.toLowerCase().includes(search) ||
          b.passengerName.toLowerCase().includes(search) ||
          b.currentLocation.toLowerCase().includes(search)
      );
    }
    if (status && status !== 'all') {
      filtered = filtered.filter((b) => b.status === status);
    }
    if (flightNumber && flightNumber !== 'ALL') {
      filtered = filtered.filter((b) => b.flightNumber.toUpperCase() === flightNumber);
    }

    filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    res.json({ success: true, baggage: filtered });
  } catch (err) {
    next(err);
  }
});

router.get('/track/:bagId', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const bagId = parseBagIdFromInput(req.params.bagId);
    const bag = await db.findOne(
      'baggage',
      (b) => b.bagId.toUpperCase() === bagId,
      { bagId }
    );
    if (!bag) {
      throw new HttpError(404, `No baggage record found for Bag ID "${bagId}".`);
    }

    const [events, flights] = await Promise.all([
      db.getTrackingEvents(),
      db.getFlights(),
    ]);

    const bagEvents = events
      .filter((e) => e.bagId.toUpperCase() === bag.bagId.toUpperCase())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const flight = flights.find((f) => f.id === bag.flightId || f.flightNumber === bag.flightNumber) ?? null;
    const qrDataUrl = await QRCode.toDataURL(bag.qrPayload, {
      width: 240,
      margin: 2,
      color: { dark: '#0B1426', light: '#FFFFFF' },
    });

    res.json({
      success: true,
      baggage: bag,
      flight,
      events: bagEvents,
      qrDataUrl,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:bagId/qr', requireAuth, async (req, res, next) => {
  try {
    const bagId = parseBagIdFromInput(req.params.bagId);
    const bag = await db.findOne(
      'baggage',
      (b) => b.bagId.toUpperCase() === bagId,
      { bagId }
    );
    if (!bag) {
      throw new HttpError(404, `Baggage "${bagId}" not found.`);
    }
    const qrDataUrl = await QRCode.toDataURL(bag.qrPayload, {
      width: 280,
      margin: 2,
      color: { dark: '#0B1426', light: '#FFFFFF' },
    });
    res.json({ success: true, bagId: bag.bagId, qrDataUrl, qrPayload: bag.qrPayload });
  } catch (err) {
    next(err);
  }
});

router.post('/register', requireAuth, requireRole('staff', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      passengerId,
      passengerName,
      passengerEmail,
      flightId,
      flightNumber,
      departureAirport,
      arrivalAirport,
      baggageType,
      color,
      weightKg,
      specialHandling,
    } = req.body ?? {};

    if (!baggageType || !color || weightKg === undefined || Number(weightKg) <= 0 || Number(weightKg) > 65) {
      throw new HttpError(400, 'Please provide valid baggage type, color, and weight (0.1–65 kg).');
    }

    const [passengers, flights, existingBags] = await Promise.all([
      db.getPassengers(),
      db.getFlights(),
      db.getBaggage(),
    ]);

    let resolvedPassenger = passengers.find((p) => p.id === passengerId);
    if (!resolvedPassenger && passengerEmail) {
      resolvedPassenger = passengers.find(
        (p) => p.email.toLowerCase() === String(passengerEmail).trim().toLowerCase()
      );
    }

    const finalPassengerName = resolvedPassenger?.fullName || (typeof passengerName === 'string' ? passengerName.trim() : '');
    const finalPassengerEmail = resolvedPassenger?.email || (typeof passengerEmail === 'string' ? passengerEmail.trim().toLowerCase() : '');

    if (!finalPassengerName || !finalPassengerEmail) {
      throw new HttpError(400, 'Passenger selection or valid passenger name and email are required.');
    }

    let resolvedFlight = flights.find(
      (f) => f.id === flightId || (flightNumber && f.flightNumber.toUpperCase() === String(flightNumber).trim().toUpperCase())
    );

    const finalFlightNumber = resolvedFlight?.flightNumber || (typeof flightNumber === 'string' ? flightNumber.trim().toUpperCase() : '');
    const finalDep = (departureAirport || resolvedFlight?.departureAirport || '').trim().toUpperCase();
    const finalArr = (arrivalAirport || resolvedFlight?.arrivalAirport || '').trim().toUpperCase();

    if (!finalFlightNumber || !finalDep || !finalArr) {
      throw new HttpError(400, 'Flight number, departure airport, and destination airport are required.');
    }

    // Generate unique Bag ID
    let seqNum = 4820 + existingBags.length;
    let bagId = `ST-2026-${seqNum}`;
    while (existingBags.some((b) => b.bagId === bagId)) {
      seqNum += 1;
      bagId = `ST-2026-${seqNum}`;
    }

    const now = new Date().toISOString();
    const expectedDelivery = resolvedFlight
      ? new Date(new Date(resolvedFlight.arrivalTime).getTime() + 25 * 60_000).toISOString()
      : new Date(Date.now() + 360 * 60_000).toISOString();

    const qrPayload = JSON.stringify({
      platform: 'SKYTRACE_AI',
      bagId,
      flightNumber: finalFlightNumber,
    });
    const rfidEpc = `3034257BF7194E400000${seqNum}`;
    const startLocation = `${finalDep} Terminal Check-in Counter`;

    const newBag: BaggageRecord = {
      id: `bag-${crypto.randomUUID().slice(0, 8)}`,
      bagId,
      qrPayload,
      rfidEpc,
      passengerId: resolvedPassenger?.id ?? `pas-walkin-${seqNum}`,
      passengerName: finalPassengerName,
      passengerEmail: finalPassengerEmail,
      flightId: resolvedFlight?.id ?? `flt-adhoc-${seqNum}`,
      flightNumber: finalFlightNumber,
      departureAirport: finalDep,
      arrivalAirport: finalArr,
      baggageType,
      color: String(color).trim(),
      weightKg: Number(Number(weightKg).toFixed(1)),
      specialHandling: typeof specialHandling === 'string' && specialHandling.trim() ? specialHandling.trim() : 'Standard',
      currentCheckpointCode: 'CHECK_IN_COUNTER',
      currentLocation: startLocation,
      status: 'registered',
      expectedDelivery,
      checkInTime: now,
      updatedAt: now,
    };

    await db.insert('baggage', newBag);

    const initEvent = await db.insert('trackingEvents', {
      id: `evt-${crypto.randomUUID().slice(0, 8)}`,
      bagId,
      baggageId: newBag.id,
      flightNumber: finalFlightNumber,
      checkpointCode: 'CHECK_IN_COUNTER',
      checkpointName: 'Baggage Registered',
      location: startLocation,
      statusAfter: 'registered',
      inputSource: 'QR_SCAN',
      scannedByUserId: req.user!.userId,
      scannedByName: req.user!.fullName,
      notes: `Registered ${color} ${baggageType} (${newBag.weightKg} kg).`,
      timestamp: now,
    });

    await db.insert('staffActivity', {
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      staffUserId: req.user!.userId,
      staffName: req.user!.fullName,
      action: 'BAGGAGE_REGISTERED',
      bagId,
      details: `Registered ${bagId} for ${finalPassengerName} on ${finalFlightNumber} (${finalDep}->${finalArr})`,
      timestamp: now,
    });

    const notification = await db.insert('notifications', {
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      userId: resolvedPassenger?.userId ?? null,
      targetRole: 'passenger',
      bagId,
      title: `Baggage Registered — ${bagId}`,
      message: `Your ${color} ${baggageType} is checked in for flight ${finalFlightNumber} (${finalDep} → ${finalArr}).`,
      severity: 'info',
      readByUserIds: [],
      createdAt: now,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 2,
      color: { dark: '#0B1426', light: '#FFFFFF' },
    });

    emitBaggageRegistered(newBag);
    emitBaggageScanned({ baggage: newBag, event: initEvent });
    emitNotification(notification);

    res.status(201).json({
      success: true,
      baggage: newBag,
      event: initEvent,
      qrDataUrl,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/scan', requireAuth, requireRole('staff', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      bagIdOrPayload,
      checkpointCode,
      location,
      inputSource,
      notes,
      statusOverride,
      allowOutOfOrder,
    } = req.body ?? {};

    if (!bagIdOrPayload || !checkpointCode) {
      throw new HttpError(400, 'Bag ID (or QR payload) and target checkpoint are required.');
    }

    const bagId = parseBagIdFromInput(String(bagIdOrPayload));
    const bag = await db.findOne(
      'baggage',
      (b) => b.bagId.toUpperCase() === bagId,
      { bagId }
    );
    if (!bag) {
      throw new HttpError(404, `Baggage record "${bagId}" not found.`);
    }

    const targetCp = getCheckpointDef(String(checkpointCode));
    if (!targetCp) {
      throw new HttpError(400, `Unsupported checkpoint code "${checkpointCode}".`);
    }

    const currentCp = getCheckpointDef(bag.currentCheckpointCode);
    const currentOrder = currentCp ? currentCp.order : 1;

    // Prevent invalid backward transitions unless explicitly overridden by admin/staff for rerouting
    if (targetCp.order < currentOrder && !allowOutOfOrder) {
      throw new HttpError(
        400,
        `Invalid checkpoint transition: "${bag.bagId}" is already at "${currentCp?.label ?? bag.currentCheckpointCode}" (Step ${currentOrder}) and cannot move backward to "${targetCp.label}" (Step ${targetCp.order}).`
      );
    }

    // Prevent scanning already delivered bag forward unless reopening
    if (bag.status === 'delivered' && targetCp.code === 'FINAL_DELIVERY' && !statusOverride) {
      throw new HttpError(400, `Baggage "${bag.bagId}" has already completed Final Delivery.`);
    }

    const validSource: TrackingInputSource =
      inputSource === 'RFID_READER' || inputSource === 'MANUAL_STAFF' ? inputSource : 'QR_SCAN';

    const allowedStatuses: BaggageStatus[] = [
      'registered',
      'in_transit',
      'loaded',
      'arrived',
      'carousel',
      'delivered',
      'delayed',
      'missing',
      'damaged',
    ];
    const nextStatus: BaggageStatus =
      statusOverride && allowedStatuses.includes(statusOverride)
        ? statusOverride
        : targetCp.statusAfter;

    const finalLocation =
      typeof location === 'string' && location.trim().length > 0
        ? location.trim()
        : targetCp.defaultLocation;

    const now = new Date().toISOString();

    const updatedBag = await db.updateById('baggage', bag.id, {
      currentCheckpointCode: targetCp.code as CheckpointCode,
      currentLocation: finalLocation,
      status: nextStatus,
      updatedAt: now,
    });

    const newEvent = await db.insert('trackingEvents', {
      id: `evt-${crypto.randomUUID().slice(0, 8)}`,
      bagId: bag.bagId,
      baggageId: bag.id,
      flightNumber: bag.flightNumber,
      checkpointCode: targetCp.code as CheckpointCode,
      checkpointName: targetCp.journeyLabel,
      location: finalLocation,
      statusAfter: nextStatus,
      inputSource: validSource,
      scannedByUserId: req.user!.userId,
      scannedByName: req.user!.fullName,
      notes: typeof notes === 'string' && notes.trim() ? notes.trim() : `Processed via ${validSource.replace('_', ' ')}.`,
      timestamp: now,
    });

    await db.insert('staffActivity', {
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      staffUserId: req.user!.userId,
      staffName: req.user!.fullName,
      action: validSource === 'RFID_READER' ? 'RFID_SIMULATED_GATE_READ' : 'CHECKPOINT_SCAN',
      bagId: bag.bagId,
      details: `${targetCp.label} at ${finalLocation} -> status "${nextStatus}" (${validSource})`,
      timestamp: now,
    });

    // Trigger passenger & operations notifications on key milestones or exceptions
    const passengers = await db.getPassengers();
    const pax = passengers.find((p) => p.id === bag.passengerId || p.email.toLowerCase() === bag.passengerEmail.toLowerCase());

    const shouldNotify =
      nextStatus === 'delayed' ||
      nextStatus === 'missing' ||
      nextStatus === 'damaged' ||
      targetCp.code === 'AIRCRAFT_LOADING' ||
      targetCp.code === 'ARRIVAL_HANDLING' ||
      targetCp.code === 'BAGGAGE_CAROUSEL' ||
      targetCp.code === 'FINAL_DELIVERY' ||
      targetCp.code === 'SECURITY_SCREENING';

    if (shouldNotify) {
      let title = `Checkpoint Update — ${bag.bagId}`;
      let message = `Your baggage on flight ${bag.flightNumber} reached ${targetCp.journeyLabel} (${finalLocation}).`;
      let severity: 'info' | 'success' | 'warning' | 'alert' = 'info';

      if (targetCp.code === 'ARRIVAL_HANDLING') {
        title = `Arrived at ${bag.arrivalAirport} — ${bag.bagId}`;
        message = `Your baggage from flight ${bag.flightNumber} has arrived at ${bag.arrivalAirport} (${finalLocation}).`;
        severity = 'info';
      } else if (targetCp.code === 'BAGGAGE_CAROUSEL') {
        title = `Ready for Collection — ${bag.bagId}`;
        message = `Your baggage is now on the Baggage Carousel (${finalLocation}).`;
        severity = 'success';
      } else if (targetCp.code === 'FINAL_DELIVERY') {
        title = `Baggage Delivered — ${bag.bagId}`;
        message = `Baggage ${bag.bagId} has been verified at Final Delivery.`;
        severity = 'success';
      } else if (nextStatus === 'delayed') {
        title = `Delay Flagged — ${bag.bagId}`;
        message = `Baggage ${bag.bagId} is delayed at ${finalLocation}. Ground team notified.`;
        severity = 'warning';
      } else if (nextStatus === 'missing' || nextStatus === 'damaged') {
        title = `Exception Alert (${nextStatus.toUpperCase()}) — ${bag.bagId}`;
        message = `Baggage ${bag.bagId} was flagged as ${nextStatus} at ${finalLocation}.`;
        severity = 'alert';
      }

      const notification = await db.insert('notifications', {
        id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
        userId: pax?.userId ?? null,
        targetRole: 'passenger',
        bagId: bag.bagId,
        title,
        message,
        severity,
        readByUserIds: [],
        createdAt: now,
      });
      emitNotification(notification);
    }

    if (updatedBag) {
      emitBaggageScanned({ baggage: updatedBag, event: newEvent });
    }

    res.json({
      success: true,
      baggage: updatedBag,
      event: newEvent,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:bagId/status', requireAuth, requireRole('staff', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const bagId = parseBagIdFromInput(req.params.bagId);
    const { status, location, notes } = req.body ?? {};
    const bag = await db.findOne('baggage', (b) => b.bagId.toUpperCase() === bagId, { bagId });
    if (!bag) {
      throw new HttpError(404, `Baggage "${bagId}" not found.`);
    }

    const now = new Date().toISOString();
    const updated = await db.updateById('baggage', bag.id, {
      status: status || bag.status,
      currentLocation: location ? String(location).trim() : bag.currentLocation,
      updatedAt: now,
    });

    const event = await db.insert('trackingEvents', {
      id: `evt-${crypto.randomUUID().slice(0, 8)}`,
      bagId: bag.bagId,
      baggageId: bag.id,
      flightNumber: bag.flightNumber,
      checkpointCode: bag.currentCheckpointCode,
      checkpointName: getCheckpointDef(bag.currentCheckpointCode)?.journeyLabel ?? bag.currentCheckpointCode,
      location: location ? String(location).trim() : bag.currentLocation,
      statusAfter: status || bag.status,
      inputSource: 'MANUAL_STAFF',
      scannedByUserId: req.user!.userId,
      scannedByName: req.user!.fullName,
      notes: notes ? String(notes).trim() : `Status updated to ${status}.`,
      timestamp: now,
    });

    await db.insert('staffActivity', {
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      staffUserId: req.user!.userId,
      staffName: req.user!.fullName,
      action: 'STATUS_OVERRIDE',
      bagId: bag.bagId,
      details: `Updated status to "${status}" at ${updated?.currentLocation}`,
      timestamp: now,
    });

    if (updated) {
      emitBaggageScanned({ baggage: updated, event });
    }

    res.json({ success: true, baggage: updated, event });
  } catch (err) {
    next(err);
  }
});

export default router;
