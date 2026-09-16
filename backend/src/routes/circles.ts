import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/circles - Get all circles
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('circles_metadata')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, circles: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/circles/:id - Get circle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const circleId = parseInt(id, 10);

    const { data: circle, error: circleErr } = await supabase
      .from('circles_metadata')
      .select('*')
      .eq('circle_id', circleId)
      .single();

    if (circleErr || !circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    const { data: members } = await supabase
      .from('circle_members')
      .select('*')
      .eq('circle_id', circleId);

    const { data: contributions } = await supabase
      .from('contributions')
      .select('*')
      .eq('circle_id', circleId);

    return res.json({
      success: true,
      circle: {
        ...circle,
        members: members || [],
        contributions: contributions || []
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/circles - Create a new circle
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category = 'General Savings',
      creator_address,
      token_address = 'USDC',
      contribution_amount = 100,
      interval_days = 7,
      member_count = 5,
      collateral_required = 50,
      payout_mode = 'Fixed'
    } = req.body;

    if (!name || !creator_address) {
      return res.status(400).json({ error: 'Name and creator_address are required' });
    }

    // Generate a unique circle_id if not provided
    const circle_id = req.body.circle_id || Date.now();

    const newCircle = {
      circle_id,
      name,
      description,
      category,
      creator_address,
      token_address,
      contribution_amount: Number(contribution_amount),
      interval_days: Number(interval_days),
      member_count: Number(member_count),
      collateral_required: Number(collateral_required),
      payout_mode,
      status: 'Forming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('circles_metadata')
      .insert([newCircle])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Auto-add creator as first member
    await supabase.from('circle_members').insert([
      {
        circle_id,
        wallet_address: creator_address,
        collateral_staked: Number(collateral_required),
        joined_at: new Date().toISOString()
      }
    ]);

    return res.status(201).json({ success: true, circle: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/circles/:id/join - Join a circle
router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const circleId = parseInt(id, 10);
    const { wallet_address, collateral_staked = 0 } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }

    const { data, error } = await supabase
      .from('circle_members')
      .insert([
        {
          circle_id: circleId,
          wallet_address,
          collateral_staked: Number(collateral_staked),
          joined_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, member: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/circles/:id/contribute - Record cycle contribution
router.post('/:id/contribute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const circleId = parseInt(id, 10);
    const { cycle_index, member_address, amount, tx_hash } = req.body;

    if (cycle_index === undefined || !member_address || !amount) {
      return res.status(400).json({ error: 'cycle_index, member_address, and amount are required' });
    }

    const { data, error } = await supabase
      .from('contributions')
      .insert([
        {
          circle_id: circleId,
          cycle_index: Number(cycle_index),
          member_address,
          amount: Number(amount),
          status: 'paid',
          tx_hash: tx_hash || null,
          paid_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, contribution: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
