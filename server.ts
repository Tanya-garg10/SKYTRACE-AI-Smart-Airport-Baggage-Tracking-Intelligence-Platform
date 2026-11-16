import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db/database.js';
import { initSocketIO } from './server/services/socketService.js';
import { errorHandler } from './server/middleware/auth.js';
import authRoutes from './server/routes/authRoutes.js';
import publicRoutes from './server/routes/publicRoutes.js';
import baggageRoutes from './server/routes/baggageRoutes.js';
import reportRoutes from './server/routes/reportRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import aiRoutes from './server/routes/aiRoutes.js';

async function startServer() {
  await db.init();

  const app = express();
  const httpServer = http.createServer(app);
  initSocketIO(httpServer);

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // Health & system diagnostics
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'SKYTRACE AI',
      dbMode: db.getMode(),
      aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      timestamp: new Date().toISOString(),
    });
  });

  // Domain API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/baggage', baggageRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);

  // API 404 handler
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'API endpoint not found.' });
  });

  app.use(errorHandler);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? { server: httpServer } : false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[SKYTRACE AI] Server running on http://0.0.0.0:${PORT} (DB: ${db.getMode()})`);
  });
}

startServer().catch((err) => {
  console.error('[SKYTRACE AI] Fatal startup error:', err);
  process.exit(1);
});
