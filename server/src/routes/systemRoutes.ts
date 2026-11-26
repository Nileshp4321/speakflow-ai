import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env';

const router = Router();

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// GET /api/config — safe frontend configuration, NO secrets
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      geminiModel: config.geminiModel,
      appName: 'SpeakFlow AI',
    },
  });
});

export default router;
