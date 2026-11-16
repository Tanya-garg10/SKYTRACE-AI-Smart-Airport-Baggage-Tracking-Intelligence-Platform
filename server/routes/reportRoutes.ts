import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import {
  AuthenticatedRequest,
  HttpError,
  requireAuth,
  requireRole,
} from '../middleware/auth.js';
import { emitNotification, emitReportUpdate } from '../services/socketService.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const reports = await db.getReports();
    const user = req.user!;
    let filtered = reports;

    if (user.role === 'passenger') {
      filtered = reports.filter(
        (r) =>
          r.passengerEmail.toLowerCase() === user.email.toLowerCase() ||
          r.passengerId === user.userId
      );
    }

    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ success: true, reports: filtered });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      bagId,
      flightNumber,
      description,
      color,
      baggageType,
      lastKnownLocation,
      issueCategory,
      details,
    } = req.body ?? {};

    if (!bagId || !flightNumber || !description || !lastKnownLocation || !issueCategory) {
      throw new HttpError(400, 'Bag ID, flight number, description, last known location, and issue category are required.');
    }

    const user = req.user!;
    const passengers = await db.getPassengers();
    const passenger = passengers.find((p) => p.userId === user.userId);
    const now = new Date().toISOString();

    const report = await db.insert('reports', {
      id: `rep-${crypto.randomUUID().slice(0, 8)}`,
      bagId: String(bagId).trim().toUpperCase(),
      flightNumber: String(flightNumber).trim().toUpperCase(),
      passengerId: passenger?.id ?? user.userId,
      passengerName: user.fullName,
      passengerEmail: user.email,
      description: String(description).trim(),
      color: color ? String(color).trim() : 'Unspecified',
      baggageType: baggageType ? String(baggageType).trim() : 'Hardshell',
      lastKnownLocation: String(lastKnownLocation).trim(),
      issueCategory,
      details: details ? String(details).trim() : '',
      status: 'open',
      resolutionNotes: '',
      createdAt: now,
      updatedAt: now,
    });

    // If matching bag exists in system and category is missing/damaged, flag bag status as well
    const bag = await db.findOne(
      'baggage',
      (b) => b.bagId.toUpperCase() === report.bagId,
      { bagId: report.bagId }
    );
    if (bag && (issueCategory === 'missing' || issueCategory === 'damaged')) {
      await db.updateById('baggage', bag.id, {
        status: issueCategory === 'missing' ? 'missing' : 'damaged',
        updatedAt: now,
      });
    }

    const staffNotification = await db.insert('notifications', {
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      userId: null,
      targetRole: 'staff',
      bagId: report.bagId,
      title: `Incident Filed (${issueCategory.toUpperCase()}) — ${report.bagId}`,
      message: `${user.fullName} reported ${issueCategory} baggage on flight ${report.flightNumber} (Last seen: ${report.lastKnownLocation}).`,
      severity: 'alert',
      readByUserIds: [],
      createdAt: now,
    });

    emitReportUpdate(report);
    emitNotification(staffNotification);

    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, requireRole('staff', 'admin'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, resolutionNotes } = req.body ?? {};
    const existing = await db.findOne(
      'reports',
      (r) => r.id === req.params.id,
      { id: req.params.id }
    );
    if (!existing) {
      throw new HttpError(404, 'Incident report not found.');
    }

    const now = new Date().toISOString();
    const updated = await db.updateById('reports', existing.id, {
      status: status || existing.status,
      resolutionNotes:
        resolutionNotes !== undefined ? String(resolutionNotes).trim() : existing.resolutionNotes,
      updatedAt: now,
    });

    await db.insert('staffActivity', {
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      staffUserId: req.user!.userId,
      staffName: req.user!.fullName,
      action: 'INCIDENT_UPDATED',
      bagId: existing.bagId,
      details: `Report ${existing.id} marked "${status || existing.status}"`,
      timestamp: now,
    });

    if (updated) {
      emitReportUpdate(updated);

      const passengers = await db.getPassengers();
      const pax = passengers.find(
        (p) => p.id === updated.passengerId || p.email.toLowerCase() === updated.passengerEmail.toLowerCase()
      );
      const paxNotif = await db.insert('notifications', {
        id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
        userId: pax?.userId ?? null,
        targetRole: 'passenger',
        bagId: updated.bagId,
        title: `Incident Update — ${updated.bagId}`,
        message: `Your ${updated.issueCategory} report status is now "${updated.status}". ${
          updated.resolutionNotes ? `Note: ${updated.resolutionNotes}` : ''
        }`,
        severity: updated.status === 'resolved' ? 'success' : 'info',
        readByUserIds: [],
        createdAt: now,
      });
      emitNotification(paxNotif);
    }

    res.json({ success: true, report: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
