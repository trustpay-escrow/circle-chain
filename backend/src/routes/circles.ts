import { Router, Request, Response } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { CircleMetadata, CircleMember } from '../types';

const router = Router();

// In-memory store fallback when live Supabase is not connected
const mockCircles: CircleMetadata[] = [
  {
    circle_id: '1',
    name: 'Lagos Tech Innovators Ajo',
    description: 'Bi-weekly USDC savings pool for developers & tech founders.',
    category: 'Tech Founders',
    creator_address: 'GABC1234567890WXYZ1234567890',
    token_address: 'USDC',
    contribution_amount: 200,
    interval_days: 14,
    member_count: 5,
    current_members: 3,
    collateral_required: 100,
    payout_mode: 'Fixed',
    status: 'Forming',
    current_cycle: 0,
    created_at: new Date().toISOString(),
  },
  {
    circle_id: '2',
    name: 'Abuja Market Traders Esusu',
    description: 'Weekly community rotating savings pool.',
    category: 'Market Traders',
    creator_address: 'GBX98765432104K2L9876543210',
    token_address: 'USDC',
    contribution_amount: 50,
    interval_days: 7,
    member_count: 10,
    current_members: 10,
    collateral_required: 25,
    payout_mode: 'Fixed',
    status: 'Active',
    current_cycle: 1,
    created_at: new Date().toISOString(),
  },
];

const mockMembers: Record<string, CircleMember[]> = {
  '1': [
    { circle_id: '1', wallet_address: 'GABC1234567890WXYZ1234567890', collateral_staked: 100, payout_received: false, payout_order_index: 0 },
    { circle_id: '1', wallet_address: 'GBX98765432104K2L9876543210', collateral_staked: 100, payout_received: false, payout_order_index: 1 },
    { circle_id: '1', wallet_address: 'GDEF4567890123LMNO4567890123', collateral_staked: 100, payout_received: false, payout_order_index: 2 },
  ],
  '2': Array.from({ length: 10 }, (_, i) => ({
    circle_id: '2',
    wallet_address: `GUSER${i}1234567890WXYZ`,
    collateral_staked: 25,
    payout_received: i === 0,
    payout_order_index: i,
  })),
};

/**
 * GET /api/circles
 * Query all circles with optional category, status, or search filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, search } = req.query;

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('circles_metadata').select('*');

      if (status) query = query.eq('status', status as string);
      if (category) query = query.eq('category', category as string);
      if (search) query = query.ilike('name', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, data: data || [] });
    }

    // Fallback in-memory query
    let filtered = [...mockCircles];
    if (status) {
      filtered = filtered.filter((c) => c.status.toLowerCase() === (status as string).toLowerCase());
    }
    if (category) {
      filtered = filtered.filter((c) => c.category.toLowerCase().includes((category as string).toLowerCase()));
    }
    if (search) {
      filtered = filtered.filter((c) => c.name.toLowerCase().includes((search as string).toLowerCase()));
    }

    return res.json({ success: true, data: filtered });
  } catch (err: any) {
    console.error('Error fetching circles:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

/**
 * GET /api/circles/:id
 * Retrieve circle metadata details & roster of members
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data: circle, error: circleErr } = await supabase
        .from('circles_metadata')
        .select('*')
        .eq('circle_id', id)
        .single();

      if (circleErr || !circle) {
        return res.status(404).json({ success: false, error: 'Circle not found' });
      }

      const { data: members, error: memErr } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', id);

      if (memErr) throw memErr;

      return res.json({
        success: true,
        data: {
          ...circle,
          members: members || [],
        },
      });
    }

    // Fallback in-memory lookup
    const circle = mockCircles.find((c) => c.circle_id === id);
    if (!circle) {
      return res.status(404).json({ success: false, error: 'Circle not found' });
    }

    const members = mockMembers[id] || [];
    return res.json({
      success: true,
      data: {
        ...circle,
        members,
      },
    });
  } catch (err: any) {
    console.error(`Error fetching circle #${req.params.id}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

/**
 * POST /api/circles
 * Register/Sync new circle metadata post Soroban creation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: Partial<CircleMetadata> = req.body;

    if (!body.name || !body.creator_address) {
      return res.status(400).json({ success: false, error: 'Name and creator address are required' });
    }

    const newCircle: CircleMetadata = {
      circle_id: body.circle_id || String(Date.now()),
      name: body.name,
      description: body.description || '',
      category: body.category || 'General Savings',
      creator_address: body.creator_address,
      token_address: body.token_address || 'USDC',
      contribution_amount: body.contribution_amount || 100,
      interval_days: body.interval_days || 7,
      member_count: body.member_count || 5,
      current_members: 1,
      collateral_required: body.collateral_required || 50,
      payout_mode: body.payout_mode || 'Fixed',
      status: 'Forming',
      current_cycle: 0,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('circles_metadata').insert([newCircle]).select().single();
      if (error) throw error;

      // Add creator as initial member
      await supabase.from('circle_members').insert([
        {
          circle_id: newCircle.circle_id,
          wallet_address: body.creator_address,
          collateral_staked: newCircle.collateral_required,
          payout_received: false,
          payout_order_index: 0,
        },
      ]);

      return res.status(201).json({ success: true, data });
    }

    // Fallback in-memory
    mockCircles.push(newCircle);
    mockMembers[newCircle.circle_id] = [
      {
        circle_id: newCircle.circle_id,
        wallet_address: body.creator_address,
        collateral_staked: newCircle.collateral_required,
        payout_received: false,
        payout_order_index: 0,
      },
    ];

    return res.status(201).json({ success: true, data: newCircle });
  } catch (err: any) {
    console.error('Error creating circle:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

/**
 * POST /api/circles/:id/join
 * Register member joining a circle
 */
router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data: circle } = await supabase.from('circles_metadata').select('*').eq('circle_id', id).single();
      if (!circle) return res.status(404).json({ success: false, error: 'Circle not found' });

      const { data: existingMembers } = await supabase.from('circle_members').select('*').eq('circle_id', id);
      const memberCount = existingMembers?.length || 0;

      if (memberCount >= circle.member_count) {
        return res.status(400).json({ success: false, error: 'Circle is already full' });
      }

      const newMember = {
        circle_id: id,
        wallet_address: walletAddress,
        collateral_staked: circle.collateral_required,
        payout_received: false,
        payout_order_index: memberCount,
      };

      const { data, error } = await supabase.from('circle_members').insert([newMember]).select().single();
      if (error) throw error;

      // Update status if circle is now full
      if (memberCount + 1 === circle.member_count) {
        await supabase.from('circles_metadata').update({ status: 'Active' }).eq('circle_id', id);
      }

      return res.json({ success: true, data });
    }

    // Fallback in-memory
    const circle = mockCircles.find((c) => c.circle_id === id);
    if (!circle) return res.status(404).json({ success: false, error: 'Circle not found' });

    const members = mockMembers[id] || [];
    if (members.length >= circle.member_count) {
      return res.status(400).json({ success: false, error: 'Circle is full' });
    }

    const newMem: CircleMember = {
      circle_id: id,
      wallet_address: walletAddress,
      collateral_staked: circle.collateral_required,
      payout_received: false,
      payout_order_index: members.length,
    };
    members.push(newMem);
    mockMembers[id] = members;
    circle.current_members = members.length;

    if (members.length === circle.member_count) {
      circle.status = 'Active';
    }

    return res.json({ success: true, data: newMem });
  } catch (err: any) {
    console.error(`Error joining circle #${req.params.id}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

export default router;
