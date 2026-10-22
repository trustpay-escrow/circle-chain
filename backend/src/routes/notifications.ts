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

    const notifications = await prisma.notification.findMany({
      where: { wallet_address: wallet },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    return res.json({ success: true, notifications: serializeData(notifications || []) });
  } catch (err: any) {
    console.error('[Notifications API] Error fetching notifications:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch notifications from database' });
  }
});

// POST /api/notifications - Create notification
router.post('/', async (req: Request, res: Response) => {
  try {
    const { wallet_address, circle_id, message, notification_type } = req.body;

    if (!wallet_address || !circle_id || !message || !notification_type) {
      return res.status(400).json({ success: false, error: 'Missing required notification fields' });
    }

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
  } catch (err: any) {
    console.error('[Notifications API] Error creating notification:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to create notification in database' });
  }
});

// POST /api/notifications/remind - Off-chain reminder trigger
router.post('/remind', async (req: Request, res: Response) => {
  try {
    const { circleId, cycleIndex } = req.body;

    if (!circleId) {
      return res.status(400).json({ success: false, error: 'circleId is required' });
    }

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

    return res.json({
      success: true,
      message: `Off-chain notifications queued for Circle #${circleId}, Cycle ${cycleIndex ?? 1}`
    });
  } catch (err: any) {
    console.error('[Notifications API] Error triggering reminders:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to trigger reminders' });
  }
});

export default router;
