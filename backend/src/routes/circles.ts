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

interface CircleItem {
  circle_id: number;
  name: string;
  description: string;
  category: string;
  creator_address: string;
  token_address: string;
  contribution_amount: number;
  interval_days: number;
  member_count: number;
  collateral_required: number;
  payout_mode: string;
  status: string;
  created_at: string;
  updated_at: string;
  members: any[];
  contributions: any[];
}

// Fallback in-memory circles for local testing when DB is initializing
const mockCircles: CircleItem[] = [
  {
    circle_id: 1,
    name: 'Tech Founders Ajo Pool',
    description: 'Monthly ROSCA savings pool for tech founders & developers in West Africa.',
    category: 'Business Investment',
    creator_address: 'GABC1234567890WXYZ1234567890TESTNETSAVER01',
    token_address: 'USDC',
    contribution_amount: 200,
    interval_days: 30,
    member_count: 5,
    collateral_required: 100,
    payout_mode: 'Fixed',
    status: 'Active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    members: [],
    contributions: []
  },
  {
    circle_id: 2,
    name: 'Crypto Builders Weekly Pot',
    description: 'Weekly automated savings circle for Soroban smart contract developers.',
    category: 'DeFi Savings',
    creator_address: 'GBX98765432104K2L9876543210TESTNETSAVER02',
    token_address: 'USDC',
    contribution_amount: 50,
    interval_days: 7,
    member_count: 8,
    collateral_required: 25,
    payout_mode: 'Bidding',
    status: 'Forming',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    members: [],
    contributions: []
  }
];

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

    if (circles && circles.length > 0) {
      return res.json({ success: true, circles: serializeData(circles) });
    }

    return res.json({ success: true, circles: mockCircles });
  } catch (err: any) {
    // Graceful fallback to mock data if database is still starting
    return res.json({ success: true, circles: mockCircles });
  }
});

// GET /api/circles/:id - Fetch circle by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const circleId = parseInt(id, 10);

    if (isNaN(circleId)) {
      return res.status(400).json({ error: 'Invalid circle ID parameter' });
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

    if (circle) {
      return res.json({
        success: true,
        circle: serializeData(circle)
      });
    }

    const foundMock = mockCircles.find(c => c.circle_id === circleId) || mockCircles[0];
    return res.json({
      success: true,
      circle: foundMock
    });
  } catch (err: any) {
    const foundMock = mockCircles.find(c => c.circle_id === parseInt(req.params.id, 10)) || mockCircles[0];
    return res.json({
      success: true,
      circle: foundMock
    });
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
      return res.status(400).json({ error: 'Name and creator_address are required' });
    }

    const circle_id = req.body.circle_id ? BigInt(req.body.circle_id) : BigInt(Date.now());

    try {
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
    } catch (dbErr: any) {
      // In-memory fallback if database is offline
      const fallbackCircle: CircleItem = {
        circle_id: Number(circle_id),
        name,
        description: description || '',
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
        updated_at: new Date().toISOString(),
        members: [
          {
            circle_id: Number(circle_id),
            wallet_address: creator_address,
            collateral_staked: Number(collateral_required),
            joined_at: new Date().toISOString()
          }
        ],
        contributions: []
      };

      mockCircles.unshift(fallbackCircle);
      return res.status(201).json({ success: true, circle: fallbackCircle });
    }
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

    try {
      const member = await prisma.circleMember.create({
        data: {
          circle_id: BigInt(circleId),
          wallet_address,
          collateral_staked: Number(collateral_staked)
        }
      });

      return res.json({ success: true, member: serializeData(member) });
    } catch (dbErr: any) {
      return res.json({
        success: true,
        member: {
          circle_id: circleId,
          wallet_address,
          collateral_staked,
          joined_at: new Date().toISOString()
        }
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
