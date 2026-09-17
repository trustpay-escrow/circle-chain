import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import circlesRouter from './routes/circles';
import profilesRouter from './routes/profiles';
import notificationsRouter from './routes/notifications';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Global Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'CircleChain Express Off-Chain Indexer & Notification API',
    timestamp: new Date().toISOString()
  });
});

// Mount Router API Endpoints
app.use('/api/circles', circlesRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/notifications', notificationsRouter);

app.listen(PORT, () => {
  console.log(`🚀 CircleChain Express server running on port ${PORT}`);
});
