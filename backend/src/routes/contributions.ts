import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ContributionRecord } from '../types';

const router = Router();

function serializeData(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === 'bigint') return Number(value);
      return value;
    })
  );
}

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
    const numericCircleId = parseInt(circleId, 10);

    if (!isNaN(numericCircleId)) {
      try {
        const contributions = await prisma.contribution.findMany({
          where: { circle_id: BigInt(numericCircleId) },
          orderBy: { cycle_index: 'asc' }
        });

        if (contributions && contributions.length > 0) {
          return res.json({ success: true, data: serializeData(contributions) });
        }
      } catch (dbErr) {
        // Fallback to in-memory filter
      }
    }

    const list = mockContributions.filter((c) => c.circle_id === circleId);
    return res.json({ success: true, data: list });
  } catch (err: any) {
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

    const numericCircleId = parseInt(circle_id, 10);

    if (!isNaN(numericCircleId)) {
      try {
        const created = await prisma.contribution.create({
          data: {
            circle_id: BigInt(numericCircleId),
            cycle_index: Number(cycle_index),
            member_address,
            amount: Number(amount),
            status: 'paid',
            tx_hash: tx_hash || null
          }
        });

        // Increment user punctual contributions
        await prisma.userProfile.updateMany({
          where: { wallet_address: member_address },
          data: {
            punctual_contributions: { increment: 1 }
          }
        });

        return res.status(201).json({ success: true, data: serializeData(created) });
      } catch (dbErr) {
        // Fallback
      }
    }

    const record: ContributionRecord = {
      circle_id: String(circle_id),
      cycle_index: Number(cycle_index),
      member_address,
      amount: Number(amount),
      status: 'paid',
      tx_hash: tx_hash || '',
      paid_at: new Date().toISOString(),
    };

    mockContributions.push(record);
    return res.status(201).json({ success: true, data: record });
  } catch (err: any) {
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

    const numericCircleId = parseInt(circle_id, 10);

    if (!isNaN(numericCircleId)) {
      try {
        await prisma.circleMember.updateMany({
          where: {
            circle_id: BigInt(numericCircleId),
            wallet_address: recipient_address
          },
          data: { payout_received: true }
        });

        await prisma.notification.create({
          data: {
            wallet_address: recipient_address,
            circle_id: BigInt(numericCircleId),
            message: `Payout of ${total_pot || 0} USDC for Cycle #${Number(cycle_index) + 1} has been released to your wallet!`,
            notification_type: 'payout_received',
            is_read: false
          }
        });
      } catch (dbErr) {
        // Fallback
      }
    }

    return res.json({
      success: true,
      message: `Payout of ${total_pot || 0} USDC logged for recipient ${recipient_address} in Cycle #${Number(cycle_index) + 1}`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

export default router;
