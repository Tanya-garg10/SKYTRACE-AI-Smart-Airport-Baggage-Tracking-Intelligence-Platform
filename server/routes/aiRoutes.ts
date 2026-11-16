import { Router } from 'express';
import { db } from '../db/database.js';
import { HttpError, requireAuth, requireRole } from '../middleware/auth.js';
import {
  analyzeDelayRisksWithAI,
  askOperationsAssistant,
  computeDeterministicAnomalies,
} from '../services/aiService.js';

const router = Router();

router.use(requireAuth, requireRole('staff', 'admin'));

router.get('/delay-risk', async (req, res, next) => {
  try {
    const bagId = typeof req.query.bagId === 'string' ? req.query.bagId.trim() : undefined;
    const result = await analyzeDelayRisksWithAI(bagId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/anomalies', async (_req, res, next) => {
  try {
    const [baggage, events] = await Promise.all([
      db.getBaggage(),
      db.getTrackingEvents(),
    ]);
    const anomalies = computeDeterministicAnomalies(baggage, events);
    res.json({ success: true, anomalies });
  } catch (err) {
    next(err);
  }
});

router.post('/assistant', async (req, res, next) => {
  try {
    const { question } = req.body ?? {};
    if (!question || typeof question !== 'string' || question.trim().length < 2) {
      throw new HttpError(400, 'Please enter an operations question.');
    }
    const reply = await askOperationsAssistant(question.trim());
    res.json({ success: true, ...reply });
  } catch (err) {
    next(err);
  }
});

export default router;
