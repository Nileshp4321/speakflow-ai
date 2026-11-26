import './config/env'; // Load env vars first
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import transcriptionRoutes from './routes/transcriptionRoutes';
import systemRoutes from './routes/systemRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { attachWebSocketServer } from './websocket/wsServer';

const app = express();
const httpServer = http.createServer(app);

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', systemRoutes);
app.use('/api/transcriptions', transcriptionRoutes);

// ─── 404 & Error handlers ───────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── WebSocket ───────────────────────────────────────────────────────────────
attachWebSocketServer(httpServer);

// ─── Startup ─────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectDatabase();

  httpServer.listen(config.port, () => {
    console.log(`\n🚀 SpeakFlow AI server running`);
    console.log(`   HTTP  → http://localhost:${config.port}`);
    console.log(`   WS    → ws://localhost:${config.port}/ws`);
    console.log(`   Model → ${config.geminiModel}`);
    console.log(`   Env   → ${config.nodeEnv}\n`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

export default app;
