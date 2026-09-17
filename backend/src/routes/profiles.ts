import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/profiles/:wallet - Get profile by Stellar public key
router.get('/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    if (error || !data) {
      // Default profile if not found
      return res.json({
        success: true,
        profile: {
          wallet_address: wallet,
          display_name: `Saver (${wallet.slice(0, 4)}...${wallet.slice(-4)})`,
          avatar_url: null,
          bio: 'CircleChain ROSCA Participant',
          email: null,
          reputation_score: 95,
          circles_completed: 0,
          punctual_contributions: 0,
          total_collateral_staked: 0
        }
      });
    }

    return res.json({ success: true, profile: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/profiles - Upsert user profile
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      wallet_address,
      display_name,
      avatar_url,
      bio,
      email,
      reputation_score,
      circles_completed,
      punctual_contributions,
      total_collateral_staked
    } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }

    const profileData = {
      wallet_address,
      display_name: display_name || `Saver (${wallet_address.slice(0, 4)}...${wallet_address.slice(-4)})`,
      avatar_url: avatar_url || null,
      bio: bio || null,
      email: email || null,
      reputation_score: reputation_score !== undefined ? Number(reputation_score) : 95,
      circles_completed: circles_completed !== undefined ? Number(circles_completed) : 0,
      punctual_contributions: punctual_contributions !== undefined ? Number(punctual_contributions) : 0,
      total_collateral_staked: total_collateral_staked !== undefined ? Number(total_collateral_staked) : 0,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (error) {
      console.error('Supabase profile upsert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, profile: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
