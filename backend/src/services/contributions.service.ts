import { contributionsRepository, CreateContributionDto } from '../repositories/contributions.repository';
import { profilesRepository } from '../repositories/profiles.repository';
import { notificationsRepository } from '../repositories/notifications.repository';
import { transactionVerifier } from '../lib/transaction-verifier';
import { config } from '../config';

export class ContributionsService {
  async getContributionsByCircle(circleId: number) {
    return contributionsRepository.findByCircleId(circleId);
  }

  async recordContribution(dto: CreateContributionDto) {
    let verifiedOnChain = false;

    // Strict on-chain verification if a tx_hash is provided
    if (dto.tx_hash) {
      const verification = await transactionVerifier.verifyTransaction(
        dto.tx_hash,
        dto.member_address
      );

      if (config.REQUIRE_ONCHAIN_TX_VERIFICATION && !verification.verified) {
        throw new Error(
          `On-chain transaction verification failed: ${verification.error || 'Transaction not found or failed on ledger'}`
        );
      }

      verifiedOnChain = verification.verified;
    } else if (config.REQUIRE_ONCHAIN_TX_VERIFICATION && config.NODE_ENV === 'production') {
      throw new Error('Transaction hash is required for on-chain contribution verification');
    }

    const contribution = await contributionsRepository.create({
      ...dto,
      status: verifiedOnChain ? 'verified' : 'paid'
    });

    // ONLY grant punctual contributions / reputation score increments if verified on-chain!
    // Prevents malicious scripts from inflating scores without real on-chain ledger proof.
    if (verifiedOnChain) {
      await profilesRepository.incrementPunctualContributions(dto.member_address);
    }

    return {
      ...contribution,
      verified_on_chain: verifiedOnChain
    };
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
