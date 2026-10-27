import { contributionsRepository, CreateContributionDto } from '../repositories/contributions.repository';
import { profilesRepository } from '../repositories/profiles.repository';
import { notificationsRepository } from '../repositories/notifications.repository';

export class ContributionsService {
  async getContributionsByCircle(circleId: number) {
    return contributionsRepository.findByCircleId(circleId);
  }

  async recordContribution(dto: CreateContributionDto) {
    const contribution = await contributionsRepository.create(dto);
    // Asynchronously or sequentially increment punctual contributions
    await profilesRepository.incrementPunctualContributions(dto.member_address);
    return contribution;
  }

  async recordPayout(circleId: number, cycleIndex: number, recipientAddress: string, totalPot: number = 0) {
    await contributionsRepository.markPayoutReceived(circleId, recipientAddress);

    await notificationsRepository.create({
      wallet_address: recipientAddress,
      circle_id: circleId,
      message: `Payout of ${totalPot} USDC for Cycle #${Number(cycleIndex) + 1} has been released to your wallet!`,
      notification_type: 'payout_received'
    });

    return {
      success: true,
      message: `Payout of ${totalPot} USDC logged for recipient ${recipientAddress} in Cycle #${Number(cycleIndex) + 1}`
    };
  }
}

export const contributionsService = new ContributionsService();
