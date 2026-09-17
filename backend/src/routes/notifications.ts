import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/notifications/:wallet - Get notifications for user wallet
router.get('/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, notifications: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/notifications - Create notification
router.post('/', async (req: Request, res: Response) => {
  try {
    const { wallet_address, circle_id, message, notification_type } = req.body;

    if (!wallet_address || !circle_id || !message || !notification_type) {
      return res.status(400).json({ error: 'Missing required notification fields' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          wallet_address,
          circle_id: Number(circle_id),
          message,
          notification_type,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ success: true, notification: data });
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

    // Fetch members of circle to notify
    const { data: members } = await supabase
      .from('circle_members')
      .select('wallet_address')
      .eq('circle_id', Number(circleId));

    if (members && members.length > 0) {
      const newNotifications = members.map((m) => ({
        wallet_address: m.wallet_address,
        circle_id: Number(circleId),
        message: `Reminder: Contribution for Cycle ${cycleIndex !== undefined ? cycleIndex + 1 : 1} is due soon!`,
        notification_type: 'contribution_due',
        is_read: false,
        created_at: new Date().toISOString()
      }));

      await supabase.from('notifications').insert(newNotifications);
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
