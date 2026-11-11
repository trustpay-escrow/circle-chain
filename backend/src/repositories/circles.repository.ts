import { prisma } from '../db';
import { serializeData } from '../lib/serialization';

export interface CreateCircleDto {
  circle_id?: string;
  name: string;
  description?: string | null;
  category?: string;
  creator_address: string;
  token_address?: string;
  contribution_amount?: number;
  interval_days?: number;
  member_count?: number;
  collateral_required?: number;
  payout_mode?: string;
}

export class CirclesRepository {
  async findAll() {
    const circles = await prisma.circleMetadata.findMany({
      include: {
        members: true,
        contributions: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    return serializeData(circles || []);
  }

  async findById(id: bigint | number) {
    const circle = await prisma.circleMetadata.findUnique({
      where: {
        circle_id: BigInt(id)
      },
      include: {
        members: true,
        contributions: true
      }
    });
    return circle ? serializeData(circle) : null;
  }

  async create(data: CreateCircleDto) {
    const circleId = data.circle_id ? BigInt(data.circle_id) : BigInt(Date.now());
    const collateral = Number(data.collateral_required ?? 50);

    const created = await prisma.circleMetadata.create({
      data: {
        circle_id: circleId,
        name: data.name,
        description: data.description || null,
        category: data.category || 'General Savings',
        creator_address: data.creator_address,
        token_address: data.token_address || 'USDC',
        contribution_amount: Number(data.contribution_amount ?? 100),
        interval_days: Number(data.interval_days ?? 7),
        member_count: Number(data.member_count ?? 5),
        collateral_required: collateral,
        payout_mode: data.payout_mode || 'Fixed',
        status: 'Forming',
        members: {
          create: {
            wallet_address: data.creator_address,
            collateral_staked: collateral,
            payout_order_index: 0
          }
        }
      },
      include: {
        members: true
      }
    });

    return serializeData(created);
  }

  async addMember(circleId: bigint | number, walletAddress: string, collateralStaked: number = 0) {
    const member = await prisma.circleMember.create({
      data: {
        circle_id: BigInt(circleId),
        wallet_address: walletAddress,
        collateral_staked: Number(collateralStaked)
      }
    });
    return serializeData(member);
  }

  async removeMember(circleId: bigint | number, walletAddress: string) {
    const member = await prisma.circleMember.deleteMany({
      where: {
        circle_id: BigInt(circleId),
        wallet_address: walletAddress
      }
    });
    return member;
  }

  async cancelCircle(circleId: bigint | number) {
    const updated = await prisma.circleMetadata.update({
      where: { circle_id: BigInt(circleId) },
      data: { status: 'Cancelled' }
    });
    return serializeData(updated);
  }

  async slashDefaulter(
    circleId: bigint | number,
    defaulterAddress: string,
    cycleIndex: number,
    amount: number,
    callerAddress: string,
    txHash?: string
  ) {
    // 1. Create contribution covered by liquidated collateral
    await prisma.contribution.create({
      data: {
        circle_id: BigInt(circleId),
        cycle_index: cycleIndex,
        member_address: defaulterAddress,
        amount: Number(amount),
        status: 'slashed_covered',
        tx_hash: txHash || null
      }
    });

    // 2. Liquidate defaulter collateral staked to 0
    await prisma.circleMember.updateMany({
      where: {
        circle_id: BigInt(circleId),
        wallet_address: defaulterAddress
      },
      data: {
        collateral_staked: 0
      }
    });

    // 3. Reset defaulter reputation
    await prisma.userProfile.updateMany({
      where: { wallet_address: defaulterAddress },
      data: { reputation_score: 0 }
    });

    // 4. Log reputation penalty
    await prisma.reputationLog.create({
      data: {
        wallet_address: defaulterAddress,
        circle_id: BigInt(circleId),
        event_type: 'collateral_slashed',
        score_change: -90,
        reason: `Defaulted on Cycle #${cycleIndex + 1} deposit. Collateral liquidated into communal pot by ${callerAddress}.`
      }
    });

    // 5. Send notification
    await prisma.notification.create({
      data: {
        wallet_address: defaulterAddress,
        circle_id: BigInt(circleId),
        message: `Your staked collateral was liquidated on-chain into the pot due to default on Cycle #${cycleIndex + 1}.`,
        notification_type: 'slashed'
      }
    });

    return { circleId: Number(circleId), defaulter: defaulterAddress, status: 'slashed_covered' };
  }
}

export const circlesRepository = new CirclesRepository();
