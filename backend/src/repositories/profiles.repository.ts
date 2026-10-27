import { prisma } from '../db';
import { serializeData } from '../lib/serialization';

export interface UpsertProfileDto {
  wallet_address: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  email?: string | null;
  reputation_score?: number;
  circles_completed?: number;
  punctual_contributions?: number;
  total_collateral_staked?: number;
}

export class ProfilesRepository {
  async findByWallet(wallet: string) {
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

    return serializeData(profile);
  }

  async upsert(dto: UpsertProfileDto) {
    const cleanUsername = dto.username ? dto.username.replace(/^@/, '').trim() : null;

    const data = {
      wallet_address: dto.wallet_address,
      username: cleanUsername,
      display_name: dto.display_name || `Saver (${dto.wallet_address.slice(0, 4)}...${dto.wallet_address.slice(-4)})`,
      avatar_url: dto.avatar_url || null,
      bio: dto.bio || null,
      email: dto.email || null,
      reputation_score: dto.reputation_score !== undefined ? Number(dto.reputation_score) : 90,
      circles_completed: dto.circles_completed !== undefined ? Number(dto.circles_completed) : 0,
      punctual_contributions: dto.punctual_contributions !== undefined ? Number(dto.punctual_contributions) : 0,
      total_collateral_staked: dto.total_collateral_staked !== undefined ? Number(dto.total_collateral_staked) : 0
    };

    const upserted = await prisma.userProfile.upsert({
      where: { wallet_address: dto.wallet_address },
      update: data,
      create: data
    });

    return serializeData(upserted);
  }

  async incrementPunctualContributions(walletAddress: string) {
    return prisma.userProfile.updateMany({
      where: { wallet_address: walletAddress },
      data: {
        punctual_contributions: { increment: 1 }
      }
    });
  }
}

export const profilesRepository = new ProfilesRepository();
