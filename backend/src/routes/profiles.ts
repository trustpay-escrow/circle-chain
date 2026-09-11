import { Router, Request, Response } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { UserProfile } from '../types';

const router = Router();

// In-memory fallback database for user profiles
const mockProfiles: Record<string, UserProfile> = {
  GABC1234567890WXYZ1234567890: {
    wallet_address: 'GABC1234567890WXYZ1234567890',
    display_name: 'Zion Adebayo',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    bio: 'Software builder & web3 DeFi enthusiast focused on rotating credit pools.',
    email: 'zion@circlechain.app',
    reputation_score: 98,
    circles_completed: 4,
    punctual_contributions: 24,
    total_collateral_staked: 150,
    created_at: new Date().toISOString(),
  },
};

/**
 * GET /api/profiles/:walletAddress
 * Fetch user profile & reputation metrics
 */
router.get('/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return res.json({ success: true, data });
      }
    }

    // Fallback or default profile generation
    const profile = mockProfiles[walletAddress] || {
      wallet_address: walletAddress,
      display_name: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
      reputation_score: 90,
      circles_completed: 0,
      punctual_contributions: 0,
      total_collateral_staked: 0,
      created_at: new Date().toISOString(),
    };

    return res.json({ success: true, data: profile });
  } catch (err: any) {
    console.error(`Error fetching profile for ${req.params.walletAddress}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

/**
 * PUT /api/profiles/:walletAddress
 * Update profile metadata (display_name, bio, avatar_url, email)
 */
router.put('/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const { display_name, avatar_url, bio, email } = req.body;

    const updates: Partial<UserProfile> = {
      wallet_address: walletAddress,
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updates.display_name = display_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (bio !== undefined) updates.bio = bio;
    if (email !== undefined) updates.email = email;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(updates, { onConflict: 'wallet_address' })
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    // Fallback in-memory
    const existing = mockProfiles[walletAddress] || {
      wallet_address: walletAddress,
      display_name: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
      reputation_score: 90,
      circles_completed: 0,
      punctual_contributions: 0,
      total_collateral_staked: 0,
    };

    const updatedProfile = { ...existing, ...updates };
    mockProfiles[walletAddress] = updatedProfile;

    return res.json({ success: true, data: updatedProfile });
  } catch (err: any) {
    console.error(`Error updating profile for ${req.params.walletAddress}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

export default router;
