import { prisma } from '../db';
import { serializeData } from '../lib/serialization';

export interface CreateContributionDto {
  circle_id: bigint | number | string;
  cycle_index: number;
  member_address: string;
  amount: number;
  tx_hash?: string | null;
}

export class ContributionsRepository {
  async findByCircleId(circleId: bigint | number) {
    const contributions = await prisma.contribution.findMany({
      where: { circle_id: BigInt(circleId) },
      orderBy: { cycle_index: 'asc' }
    });
    return serializeData(contributions || []);
  }

  async create(data: CreateContributionDto) {
    const created = await prisma.contribution.create({
      data: {
        circle_id: BigInt(data.circle_id),
        cycle_index: Number(data.cycle_index),
        member_address: data.member_address,
        amount: Number(data.amount),
        status: 'paid',
        tx_hash: data.tx_hash || null
      }
    });
    return serializeData(created);
  }

  async markPayoutReceived(circleId: bigint | number, recipientAddress: string) {
    return prisma.circleMember.updateMany({
      where: {
        circle_id: BigInt(circleId),
        wallet_address: recipientAddress
      },
      data: { payout_received: true }
    });
  }
}

export const contributionsRepository = new ContributionsRepository();
