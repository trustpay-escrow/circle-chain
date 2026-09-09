import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'CircleChain Off-Chain Indexer & Notification Worker' });
});

// Off-chain notification reminder trigger stub (Supabase backed)
app.post('/api/notifications/remind', (req: Request, res: Response) => {
  const { circleId, cycleIndex } = req.body;
  // TODO: Trigger off-chain email/in-app notification reminders for approaching cycle deadline
  res.json({ success: true, message: `Notification reminders queued for Circle #${circleId}, Cycle ${cycleIndex}` });
});

app.listen(PORT, () => {
  console.log(`CircleChain Express server running on port ${PORT}`);
});
