import { Router, Request, Response } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const router = Router();

// Fallback in-memory circles for local testing when Supabase schema isn't created yet
const mockCircles = [
  {
    circle_id: 1,
    name: 'Tech Founders Ajo Pool',
    description: 'Monthly ROSCA savings pool for tech founders & developers in West Africa.',
    category: 'Business Investment',
    creator_address: 'GABC1234567890WXYZ1234567890',
    token_address: 'USDC',
    contribution_amount: 200,
    interval_days: 30,
    member_count: 5,
    collateral_required: 100,
    payout_mode: 'Fixed',
    status: 'Active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    circle_id: 2,
    name: 'Crypto Builders Weekly Pot',
    description: 'Weekly automated savings circle for Soroban smart contract developers.',
    category: 'DeFi Savings',
    creator_address: 'GBX98765432104K2L9876543210',
    token_address: 'USDC',
    contribution_amount: 50,
    interval_days: 7,
    member_count: 8,
    collateral_required: 25,
    payout_mode: 'Bidding',
    status: 'Forming',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// GET /api/circles - Get all circles
router.get('/', async (req: Request, res: Response) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('circles_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return res.json({ success: true, circles: data });
      } else if (error) {
        console.warn('[Supabase Warning] Could not fetch circles_metadata from Supabase, returning mock data:', error.message);
      }
    }

    return res.json({ success: true, circles: mockCircles });
  } catch (err: any) {
    return res.json({ success: true, circles: mockCircles });
  }
});

// GET /api/circles/:id - Get circle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const circleId = parseInt(id, 10);

    if (isSupabaseConfigured && supabase) {
      const { data: circle, error: circleErr } = await supabase
        .from('circles_metadata')
        .select('*')
        .eq('circle_id', circleId)
        .single();

      if (!circleErr && circle) {
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
      }
    }

    // Fallback to mock circle matching ID
    const found = mockCircles.find(c => c.circle_id === circleId) || mockCircles[0];
    return res.json({
      success: true,
      circle: {
        ...found,
        members: [],
        contributions: []
      }
    });
  } catch (err: any) {
    const found = mockCircles[0];
    return res.json({
      success: true,
      circle: {
        ...found,
        members: [],
        contributions: []
      }
    });
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

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('circles_metadata')
        .insert([newCircle])
        .select()
        .single();

      if (!error && data) {
        await supabase.from('circle_members').insert([
          {
            circle_id,
            wallet_address: creator_address,
            collateral_staked: Number(collateral_required),
            joined_at: new Date().toISOString()
          }
        ]);
        return res.status(201).json({ success: true, circle: data });
      } else if (error) {
        console.warn('[Supabase Insert Warning] Falling back to local mock insert:', error.message);
      }
    }

    mockCircles.unshift(newCircle);
    return res.status(201).json({ success: true, circle: newCircle });
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

    if (isSupabaseConfigured && supabase) {
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

      if (!error && data) {
        return res.json({ success: true, member: data });
      }
    }

    return res.json({
      success: true,
      member: {
        circle_id: circleId,
        wallet_address,
        collateral_staked,
        joined_at: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
