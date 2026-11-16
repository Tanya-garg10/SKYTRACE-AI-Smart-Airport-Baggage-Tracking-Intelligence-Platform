import { Router } from 'express';
import { db } from '../db/database.js';
import { getPublicDemoSamples } from '../db/seed.js';

const router = Router();

router.get('/stats', async (_req, res, next) => {
  try {
    const [baggage, flights, checkpoints, events] = await Promise.all([
      db.getBaggage(),
      db.getFlights(),
      db.getCheckpoints(),
      db.getTrackingEvents(),
    ]);

    const deliveredCount = baggage.filter((b) => b.status === 'delivered').length;
    const inTransitCount = baggage.filter(
      (b) => b.status === 'in_transit' || b.status === 'loaded' || b.status === 'arrived' || b.status === 'carousel'
    ).length;

    res.json({
      success: true,
      stats: {
        totalBaggageTracked: baggage.length,
        activeFlights: flights.length,
        activeCheckpoints: checkpoints.filter((c) => c.active).length,
        totalScanEvents: events.length,
        deliveredBaggage: deliveredCount,
        inTransitBaggage: inTransitCount,
        dbMode: db.getMode(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/demo-samples', (_req, res) => {
  const samples = getPublicDemoSamples();
  res.json({
    success: true,
    isDemoData: true,
    samples,
  });
});

router.get('/demo-tracking/:bagId', (req, res) => {
  const query = req.params.bagId.trim().toUpperCase();
  const samples = getPublicDemoSamples();
  const found = samples.find((s) => s.bagId === query);
  if (!found) {
    res.status(404).json({
      success: false,
      error: `Sample Bag ID "${query}" not found. Try DEMO-BAG-901, DEMO-BAG-902, or DEMO-BAG-903.`,
    });
    return;
  }
  res.json({
    success: true,
    isDemoData: true,
    record: found,
  });
});

export default router;
