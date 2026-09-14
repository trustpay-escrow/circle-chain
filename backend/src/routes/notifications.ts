import { Router, Request, Response } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { NotificationRecord } from '../types';

const router = Router();

// In-memory fallback notification queue
const mockNotifications: NotificationRecord[] = [
  {
    id: 'n1',
    wallet_address: 'GABC1234567890WXYZ1234567890',
    circle_id: '1',
    message: 'Cycle #2 payment of 200 USDC is due in 42 hours.',
    notification_type: 'contribution_due',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n2',
    wallet_address: 'GABC1234567890WXYZ1234567890',
    circle_id: '1',
    message: 'Payout of 1,000 USDC for Cycle #1 was successfully processed.',
    notification_type: 'payout_received',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

/**
 * GET /api/notifications/:walletAddress
 * Fetch notifications for a user
 */
router.get('/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: data || [] });
    }

    // Fallback in-memory query
    const list = mockNotifications.filter((n) => n.wallet_address === walletAddress);
    return res.json({ success: true, data: list });
  } catch (err: any) {
    console.error(`Error fetching notifications for ${req.params.walletAddress}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    // Fallback in-memory
    const notif = mockNotifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
    }
    return res.json({ success: true, data: notif });
  } catch (err: any) {
    console.error(`Error updating notification #${req.params.id}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

/**
 * POST /api/notifications/remind
 * Trigger off-chain cycle deadline reminders
 */
router.post('/remind', async (req: Request, res: Response) => {
  try {
    const { circleId, cycleIndex } = req.body;

    if (!circleId || cycleIndex === undefined) {
      return res.status(400).json({ success: false, error: 'circleId and cycleIndex are required' });
    }

    if (isSupabaseConfigured && supabase) {
      // Fetch members of the circle
      const { data: members } = await supabase
        .from('circle_members')
        .select('wallet_address')
        .eq('circle_id', circleId);

      if (members && members.length > 0) {
        const notificationsToInsert = members.map((m) => ({
          wallet_address: m.wallet_address,
          circle_id: circleId,
          message: `Reminder: Contribution for Cycle #${Number(cycleIndex) + 1} is due soon!`,
          notification_type: 'contribution_due',
          is_read: false,
        }));

        await supabase.from('notifications').insert(notificationsToInsert);
      }
    }

    return res.json({
      success: true,
      message: `Notification reminders queued for Circle #${circleId}, Cycle ${cycleIndex}`,
    });
  } catch (err: any) {
    console.error('Error triggering deadline reminders:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

export default router;
