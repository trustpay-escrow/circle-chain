import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import circlesRouter from './routes/circles';
import profilesRouter from './routes/profiles';
import notificationsRouter from './routes/notifications';
import contributionsRouter from './routes/contributions';
import { checkDatabaseConnection } from './lib/prisma';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 4000;

// Global Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Comprehensive Health check endpoints for Drips & Kubernetes probes
app.get('/health', async (req: Request, res: Response) => {
  const dbOk = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    service: 'CircleChain Off-Chain Indexer & Notification Engine',
    database: dbOk ? 'connected' : 'disconnected',
    engine: 'Prisma ORM + PostgreSQL 16',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/liveness', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive', uptime: process.uptime() });
});

app.get('/health/readiness', async (req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseConnection();
  res.status(200).json({
    status: 'ready',
    database: dbHealthy ? 'healthy' : 'disconnected'
  });
});

// Mount Router API Endpoints
app.use('/api/circles', circlesRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/contributions', contributionsRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 CircleChain Express server running on port ${PORT}`);
  });
}
