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

// GET /api/profiles/:wallet - Get profile by Stellar public key
router.get('/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      return res.status(400).json({ success: false, error: 'wallet parameter is required' });
    }

    let profile = await prisma.userProfile.findUnique({
      where: { wallet_address: wallet },
      include: {
        reputation_logs: {
          take: 10,
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          wallet_address: wallet,
          display_name: `Saver (${wallet.slice(0, 4)}...${wallet.slice(-4)})`,
          reputation_score: 90
        },
        include: {
          reputation_logs: true
        }
      });
    }

    return res.json({ success: true, profile: serializeData(profile) });
  } catch (err: any) {
    console.error(`[Profiles API] Error fetching profile for wallet ${req.params.wallet}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch profile from database' });
  }
});

// POST /api/profiles - Upsert user profile
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      wallet_address,
      username,
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
      return res.status(400).json({ success: false, error: 'wallet_address is required' });
    }

    const cleanUsername = username ? username.replace(/^@/, '').trim() : null;

    const profileData = {
      wallet_address,
      username: cleanUsername,
      display_name: display_name || `Saver (${wallet_address.slice(0, 4)}...${wallet_address.slice(-4)})`,
      avatar_url: avatar_url || null,
      bio: bio || null,
      email: email || null,
      reputation_score: reputation_score !== undefined ? Number(reputation_score) : 90,
      circles_completed: circles_completed !== undefined ? Number(circles_completed) : 0,
      punctual_contributions: punctual_contributions !== undefined ? Number(punctual_contributions) : 0,
      total_collateral_staked: total_collateral_staked !== undefined ? Number(total_collateral_staked) : 0
    };

    const upserted = await prisma.userProfile.upsert({
      where: { wallet_address },
      update: profileData,
      create: profileData
    });

    return res.json({ success: true, profile: serializeData(upserted) });
  } catch (err: any) {
    console.error('[Profiles API] Error saving profile:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to save profile in database' });
  }
});

export default router;
