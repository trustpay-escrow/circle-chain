import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Helper to safely serialize BigInt and Decimal fields for JSON responses
function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === 'bigint') {
        return Number(value);
      }
      return value;
    })
  );
}

// GET /api/circles - Fetch all circles
router.get('/', async (req: Request, res: Response) => {
  try {
    const circles = await prisma.circleMetadata.findMany({
      include: {
        members: true,
        contributions: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({ success: true, circles: serializeData(circles || []) });
  } catch (err: any) {
    console.error('[Circles API] Error fetching circles:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch circles from database' });
  }
});

// GET /api/circles/:id - Fetch circle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const circleId = parseInt(id, 10);

    if (isNaN(circleId)) {
      return res.status(400).json({ success: false, error: 'Invalid circle ID parameter' });
    }

    const circle = await prisma.circleMetadata.findUnique({
      where: {
        circle_id: BigInt(circleId)
      },
      include: {
        members: true,
        contributions: true
      }
    });

    if (!circle) {
      return res.status(404).json({ success: false, error: `Circle #${circleId} not found` });
    }

    return res.json({
      success: true,
      circle: serializeData(circle)
    });
  } catch (err: any) {
    console.error(`[Circles API] Error fetching circle #${req.params.id}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch circle from database' });
  }
});

// POST /api/circles - Create a new circle in Prisma PostgreSQL
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
      return res.status(400).json({ success: false, error: 'Name and creator_address are required' });
    }

    const circle_id = req.body.circle_id ? BigInt(req.body.circle_id) : BigInt(Date.now());

    const created = await prisma.circleMetadata.create({
      data: {
        circle_id,
        name,
        description: description || null,
        category,
        creator_address,
        token_address,
        contribution_amount: Number(contribution_amount),
        interval_days: Number(interval_days),
        member_count: Number(member_count),
        collateral_required: Number(collateral_required),
        payout_mode,
        status: 'Forming',
        members: {
          create: {
            wallet_address: creator_address,
            collateral_staked: Number(collateral_required),
            payout_order_index: 0
          }
        }
      },
      include: {
        members: true
      }
    });

    return res.status(201).json({ success: true, circle: serializeData(created) });
  } catch (err: any) {
    console.error('[Circles API] Error creating circle:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to create circle in database' });
  }
});

// POST /api/circles/:id/join - Join a circle
router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const circleId = parseInt(id, 10);
    const { wallet_address, collateral_staked = 0 } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ success: false, error: 'wallet_address is required' });
    }

    if (isNaN(circleId)) {
      return res.status(400).json({ success: false, error: 'Invalid circle ID parameter' });
    }

    const member = await prisma.circleMember.create({
      data: {
        circle_id: BigInt(circleId),
        wallet_address,
        collateral_staked: Number(collateral_staked)
      }
    });

    return res.json({ success: true, member: serializeData(member) });
  } catch (err: any) {
    console.error(`[Circles API] Error joining circle #${req.params.id}:`, err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to join circle in database' });
  }
});

export default router;
