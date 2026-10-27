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
}

export const circlesRepository = new CirclesRepository();
