import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { isSupabaseConfigured, supabase } from './config/supabase';

import circlesRouter from './routes/circles';
import profilesRouter from './routes/profiles';
import contributionsRouter from './routes/contributions';
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
app.get('/health', async (req: Request, res: Response) => {
  let supabaseStatus = isSupabaseConfigured ? 'connected' : 'mock-fallback';
  if (supabase) {
    try {
      const { error } = await supabase.from('circles').select('id').limit(1);
      if (error) supabaseStatus = `error: ${error.message}`;
    } catch (err: any) {
      supabaseStatus = `error: ${err?.message || 'unknown'}`;
    }
  }

  res.json({
    status: 'ok',
    service: 'CircleChain Off-Chain Indexer & Notification Worker',
    supabase: supabaseStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/circles', circlesRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/contributions', contributionsRouter);
app.use('/api/notifications', notificationsRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, async () => {
  console.log(`🚀 CircleChain Express Server running on port ${PORT}`);
  console.log(`📡 Supabase Mode: ${isSupabaseConfigured ? 'Connected (Live)' : 'Mock Fallback (Local)'}`);

  if (supabase) {
    try {
      const { error } = await supabase.from('circles').select('id').limit(1);
      if (error) {
        console.warn('⚠️ Supabase connection test returned an error:', error.message);
      } else {
        console.log('✅ Supabase connected successfully!');
      }
    } catch (err: any) {
      console.error('❌ Failed to connect to Supabase:', err?.message || err);
    }
  }
});
