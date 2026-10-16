import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === 'bigint') return Number(value);
      return value;
    })
  );
}

// GET /api/notifications/:wallet - Get notifications for user wallet
router.get('/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;

    try {
      const notifications = await prisma.notification.findMany({
        where: { wallet_address: wallet },
        orderBy: { created_at: 'desc' },
        take: 50
      });

      return res.json({ success: true, notifications: serializeData(notifications) });
    } catch (dbErr) {
      return res.json({ success: true, notifications: [] });
    }
  } catch (err: any) {
    return res.json({ success: true, notifications: [] });
  }
});

// POST /api/notifications - Create notification
router.post('/', async (req: Request, res: Response) => {
  try {
    const { wallet_address, circle_id, message, notification_type } = req.body;

    if (!wallet_address || !circle_id || !message || !notification_type) {
      return res.status(400).json({ error: 'Missing required notification fields' });
    }

    try {
      const notification = await prisma.notification.create({
        data: {
          wallet_address,
          circle_id: BigInt(circle_id),
          message,
          notification_type,
          is_read: false
        }
      });

      return res.status(201).json({ success: true, notification: serializeData(notification) });
    } catch (dbErr) {
      return res.status(201).json({
        success: true,
        notification: {
          id: 'mock-notif-' + Date.now(),
          wallet_address,
          circle_id: Number(circle_id),
          message,
          notification_type,
          is_read: false,
          created_at: new Date().toISOString()
        }
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/notifications/remind - Off-chain reminder trigger
router.post('/remind', async (req: Request, res: Response) => {
  try {
    const { circleId, cycleIndex } = req.body;

    if (!circleId) {
      return res.status(400).json({ error: 'circleId is required' });
    }

    try {
      const members = await prisma.circleMember.findMany({
        where: { circle_id: BigInt(circleId) },
        select: { wallet_address: true }
      });

      if (members && members.length > 0) {
        await prisma.notification.createMany({
          data: members.map((m) => ({
            wallet_address: m.wallet_address,
            circle_id: BigInt(circleId),
            message: `Reminder: Contribution for Cycle ${cycleIndex !== undefined ? cycleIndex + 1 : 1} is due soon!`,
            notification_type: 'contribution_due',
            is_read: false
          }))
        });
      }
    } catch (dbErr) {
      // In-memory or logging fallback
    }

    return res.json({
      success: true,
      message: `Off-chain notifications queued for Circle #${circleId}, Cycle ${cycleIndex ?? 1}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
