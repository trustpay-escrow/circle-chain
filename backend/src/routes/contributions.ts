import { Router, Request, Response } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { ContributionRecord } from '../types';

const router = Router();

// In-memory fallback matrix log
const mockContributions: ContributionRecord[] = [
  // Circle 1, Cycle 0
  { circle_id: '1', cycle_index: 0, member_address: 'GABC1234567890WXYZ1234567890', amount: 200, status: 'paid', paid_at: new Date().toISOString() },
  { circle_id: '1', cycle_index: 0, member_address: 'GBX98765432104K2L9876543210', amount: 200, status: 'paid', paid_at: new Date().toISOString() },
  { circle_id: '1', cycle_index: 0, member_address: 'GDEF4567890123LMNO4567890123', amount: 200, status: 'paid', paid_at: new Date().toISOString() },

  // Circle 1, Cycle 1
  { circle_id: '1', cycle_index: 1, member_address: 'GABC1234567890WXYZ1234567890', amount: 200, status: 'paid', paid_at: new Date().toISOString() },
];

/**
 * GET /api/contributions/:circleId
 * Fetch contribution grid matrix for visual proof dashboard
 */
router.get('/:circleId', async (req: Request, res: Response) => {
  try {
    const { circleId } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .eq('circle_id', circleId)
        .order('cycle_index', { ascending: true });

      if (error) throw error;
      return res.json({ success: true, data: data || [] });
    }

    // Fallback in-memory filter
    const list = mockContributions.filter((c) => c.circle_id === circleId);
    return res.json({ success: true, data: list });
  } catch (err: any) {
    console.error(`Error fetching contributions for circle #${req.params.circleId}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

/**
 * POST /api/contributions
 * Record/log a cycle contribution made on Soroban
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { circle_id, cycle_index, member_address, amount, tx_hash } = req.body;

    if (!circle_id || cycle_index === undefined || !member_address || !amount) {
      return res.status(400).json({ success: false, error: 'circle_id, cycle_index, member_address, and amount are required' });
    }

    const record: ContributionRecord = {
      circle_id,
      cycle_index,
      member_address,
      amount,
      status: 'paid',
      tx_hash: tx_hash || '',
      paid_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('contributions').insert([record]).select().single();
      if (error) throw error;

      // Increment user punctual_contributions count
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('punctual_contributions')
        .eq('wallet_address', member_address)
        .single();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({ punctual_contributions: (profile.punctual_contributions || 0) + 1 })
          .eq('wallet_address', member_address);
      }

      return res.status(201).json({ success: true, data });
    }

    // Fallback in-memory
    mockContributions.push(record);
    return res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    console.error('Error logging contribution:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

/**
 * POST /api/contributions/payout
 * Log pot payout release execution
 */
router.post('/payout', async (req: Request, res: Response) => {
  try {
    const { circle_id, cycle_index, recipient_address, total_pot } = req.body;

    if (!circle_id || cycle_index === undefined || !recipient_address) {
      return res.status(400).json({ success: false, error: 'circle_id, cycle_index, and recipient_address are required' });
    }

    if (isSupabaseConfigured && supabase) {
      // Mark member payout_received = true in roster
      await supabase
        .from('circle_members')
        .update({ payout_received: true })
        .match({ circle_id, wallet_address: recipient_address });

      // Create payout notification
      await supabase.from('notifications').insert([
        {
          wallet_address: recipient_address,
          circle_id,
          message: `Payout of ${total_pot} USDC for Cycle #${cycle_index + 1} has been released to your wallet!`,
          notification_type: 'payout_received',
          is_read: false,
        },
      ]);
    }

    return res.json({
      success: true,
      message: `Payout of ${total_pot || 0} USDC logged for recipient ${recipient_address} in Cycle #${cycle_index + 1}`,
    });
  } catch (err: any) {
    console.error('Error processing payout release:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

export default router;
