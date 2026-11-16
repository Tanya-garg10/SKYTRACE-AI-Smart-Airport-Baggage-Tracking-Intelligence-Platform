import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import {
  AuthenticatedRequest,
  HttpError,
  requireAuth,
  requireRole,
  toSafeUser,
} from '../middleware/auth.js';
import { CHECKPOINT_FLOW } from '../../src/shared/types.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/overview', async (_req, res, next) => {
  try {
    const [baggage, flights, events, reports, users, checkpoints] = await Promise.all([
      db.getBaggage(),
      db.getFlights(),
      db.getTrackingEvents(),
      db.getReports(),
      db.getUsers(),
      db.getCheckpoints(),
    ]);

    const statusCounts = {
      registered: baggage.filter((b) => b.status === 'registered').length,
      inTransit: baggage.filter((b) =>
        ['in_transit', 'loaded', 'arrived', 'carousel'].includes(b.status)
      ).length,
      delivered: baggage.filter((b) => b.status === 'delivered').length,
      delayed: baggage.filter((b) => b.status === 'delayed').length,
      missing: baggage.filter((b) => b.status === 'missing').length,
      damaged: baggage.filter((b) => b.status === 'damaged').length,
    };

    res.json({
      success: true,
      metrics: {
        totalBaggage: baggage.length,
        ...statusCounts,
        activeFlights: flights.length,
        totalScans: events.length,
        openReports: reports.filter((r) => r.status === 'open' || r.status === 'investigating').length,
        totalUsers: users.length,
        activeCheckpoints: checkpoints.filter((c) => c.active).length,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', async (_req, res, next) => {
  try {
    const [baggage, flights, events] = await Promise.all([
      db.getBaggage(),
      db.getFlights(),
      db.getTrackingEvents(),
    ]);

    const statusBreakdown = [
      { name: 'Delivered', count: baggage.filter((b) => b.status === 'delivered').length, color: '#10B981' },
      { name: 'In Transit / Loaded', count: baggage.filter((b) => ['in_transit', 'loaded', 'arrived', 'carousel'].includes(b.status)).length, color: '#06B6D4' },
      { name: 'Registered', count: baggage.filter((b) => b.status === 'registered').length, color: '#3B82F6' },
      { name: 'Delayed', count: baggage.filter((b) => b.status === 'delayed').length, color: '#F59E0B' },
      { name: 'Missing / Damaged', count: baggage.filter((b) => b.status === 'missing' || b.status === 'damaged').length, color: '#EF4444' },
    ];

    const flightDistribution = flights.map((f) => {
      const bags = baggage.filter((b) => b.flightId === f.id || b.flightNumber === f.flightNumber);
      return {
        flightNumber: f.flightNumber,
        route: `${f.departureAirport}-${f.arrivalAirport}`,
        total: bags.length,
        delivered: bags.filter((b) => b.status === 'delivered').length,
        inTransit: bags.filter((b) => ['registered', 'in_transit', 'loaded', 'arrived', 'carousel'].includes(b.status)).length,
        exceptions: bags.filter((b) => ['delayed', 'missing', 'damaged'].includes(b.status)).length,
      };
    });

    const checkpointActivity = CHECKPOINT_FLOW.map((cp) => ({
      checkpoint: cp.label,
      scans: events.filter((e) => e.checkpointCode === cp.code).length,
      qrScans: events.filter((e) => e.checkpointCode === cp.code && e.inputSource === 'QR_SCAN').length,
      rfidScans: events.filter((e) => e.checkpointCode === cp.code && e.inputSource === 'RFID_READER').length,
    }));

    // Hourly scan volume across last 12 hours grounded in real TrackingEvent timestamps
    const now = Date.now();
    const hourlyTrend = Array.from({ length: 8 }, (_, idx) => {
      const bucketEnd = now - (7 - idx) * 2 * 3600_000;
      const bucketStart = bucketEnd - 2 * 3600_000;
      const label = new Date(bucketEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const count = events.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= bucketStart && t < bucketEnd;
      }).length;
      return { window: label, scans: count };
    });

    res.json({
      success: true,
      analytics: {
        statusBreakdown,
        flightDistribution,
        checkpointActivity,
        hourlyTrend,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const [users, staffList, passengers] = await Promise.all([
      db.getUsers(),
      db.getStaff(),
      db.getPassengers(),
    ]);
    res.json({
      success: true,
      users: users.map(toSafeUser),
      staff: staffList,
      passengers,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/users/staff', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { fullName, email, password, department, assignedTerminal } = req.body ?? {};
    if (!fullName || !email || !password) {
      throw new HttpError(400, 'Full name, email, and initial password are required.');
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await db.findOne('users', (u) => u.email.toLowerCase() === normalizedEmail, {
      email: normalizedEmail,
    });
    if (exists) {
      throw new HttpError(409, 'A user with this email already exists.');
    }

    const now = new Date().toISOString();
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = await bcrypt.hash(String(password), 10);

    const newUser = await db.insert('users', {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      fullName: String(fullName).trim(),
      role: 'staff',
      active: true,
      createdAt: now,
    });

    const staffRec = await db.insert('staff', {
      id: `stf-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      employeeId: `OPS-${Math.floor(4200 + Math.random() * 5000)}`,
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      department: department ? String(department).trim() : 'Baggage Operations',
      assignedTerminal: assignedTerminal ? String(assignedTerminal).trim() : 'Terminal 1',
      assignedFlightIds: [],
      shiftStatus: 'on_duty',
      createdAt: now,
    });

    await db.insert('staffActivity', {
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      staffUserId: req.user!.userId,
      staffName: req.user!.fullName,
      action: 'STAFF_CREATED',
      bagId: null,
      details: `Created staff operator ${staffRec.fullName} (${staffRec.employeeId})`,
      timestamp: now,
    });

    res.status(201).json({ success: true, user: toSafeUser(newUser), staff: staffRec });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { active, role } = req.body ?? {};
    const user = await db.findOne('users', (u) => u.id === req.params.id, { id: req.params.id });
    if (!user) {
      throw new HttpError(404, 'User not found.');
    }
    const updated = await db.updateById('users', user.id, {
      active: typeof active === 'boolean' ? active : user.active,
      role: role === 'passenger' || role === 'staff' || role === 'admin' ? role : user.role,
    });
    res.json({ success: true, user: updated ? toSafeUser(updated) : null });
  } catch (err) {
    next(err);
  }
});

router.get('/flights', async (_req, res, next) => {
  try {
    const flights = await db.getFlights();
    res.json({ success: true, flights });
  } catch (err) {
    next(err);
  }
});

router.post('/flights', async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      flightNumber,
      airline,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      gate,
      carousel,
    } = req.body ?? {};

    if (!flightNumber || !departureAirport || !arrivalAirport) {
      throw new HttpError(400, 'Flight number, departure airport, and arrival airport are required.');
    }

    const code = String(flightNumber).trim().toUpperCase();
    const existing = await db.findOne(
      'flights',
      (f) => f.flightNumber.toUpperCase() === code,
      { flightNumber: code }
    );
    if (existing) {
      throw new HttpError(409, `Flight ${code} already exists.`);
    }

    const now = new Date().toISOString();
    const flight = await db.insert('flights', {
      id: `flt-${crypto.randomUUID().slice(0, 8)}`,
      flightNumber: code,
      airline: airline ? String(airline).trim() : 'SkyTrace Airways',
      departureAirport: String(departureAirport).trim().toUpperCase(),
      arrivalAirport: String(arrivalAirport).trim().toUpperCase(),
      departureTime: departureTime || new Date(Date.now() + 90 * 60_000).toISOString(),
      arrivalTime: arrivalTime || new Date(Date.now() + 360 * 60_000).toISOString(),
      gate: gate ? String(gate).trim().toUpperCase() : 'T1-A01',
      carousel: carousel ? String(carousel).trim().toUpperCase() : 'C-01',
      status: 'scheduled',
      createdAt: now,
    });

    res.status(201).json({ success: true, flight });
  } catch (err) {
    next(err);
  }
});

router.patch('/flights/:id', async (req, res, next) => {
  try {
    const existing = await db.findOne('flights', (f) => f.id === req.params.id, { id: req.params.id });
    if (!existing) {
      throw new HttpError(404, 'Flight not found.');
    }
    const { status, gate, carousel } = req.body ?? {};
    const updated = await db.updateById('flights', existing.id, {
      status: status || existing.status,
      gate: gate ? String(gate).trim() : existing.gate,
      carousel: carousel ? String(carousel).trim() : existing.carousel,
    });
    res.json({ success: true, flight: updated });
  } catch (err) {
    next(err);
  }
});

router.get('/checkpoints', async (_req, res, next) => {
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

router.patch('/checkpoints/:id', async (req, res, next) => {
  try {
    const existing = await db.findOne('checkpoints', (c) => c.id === req.params.id, { id: req.params.id });
    if (!existing) {
      throw new HttpError(404, 'Checkpoint not found.');
    }
    const { active, zone, terminal, rfidGateId } = req.body ?? {};
    const updated = await db.updateById('checkpoints', existing.id, {
      active: typeof active === 'boolean' ? active : existing.active,
      zone: zone ? String(zone).trim() : existing.zone,
      terminal: terminal ? String(terminal).trim() : existing.terminal,
      rfidGateId: rfidGateId ? String(rfidGateId).trim() : existing.rfidGateId,
    });
    res.json({ success: true, checkpoint: updated });
  } catch (err) {
    next(err);
  }
});

router.get('/activity', async (_req, res, next) => {
  try {
    const activity = await db.getStaffActivity();
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, activity });
  } catch (err) {
    next(err);
  }
});

router.get('/export/csv', async (_req, res, next) => {
  try {
    const baggage = await db.getBaggage();
    const header = [
      'Bag ID',
      'Flight Number',
      'Route',
      'Passenger Name',
      'Passenger Email',
      'Type',
      'Color',
      'Weight (kg)',
      'Status',
      'Current Checkpoint',
      'Current Location',
      'Check-in Time',
      'Updated At',
    ].join(',');

    const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = baggage.map((b) =>
      [
        b.bagId,
        b.flightNumber,
        `${b.departureAirport}->${b.arrivalAirport}`,
        b.passengerName,
        b.passengerEmail,
        b.baggageType,
        b.color,
        b.weightKg,
        b.status,
        b.currentCheckpointCode,
        b.currentLocation,
        b.checkInTime,
        b.updatedAt,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="skytrace-baggage-report.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

export default router;
