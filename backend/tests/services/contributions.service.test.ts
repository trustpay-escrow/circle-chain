import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contributionsService } from '../../src/services/contributions.service';
import { contributionsRepository } from '../../src/repositories/contributions.repository';
import { profilesRepository } from '../../src/repositories/profiles.repository';
import { transactionVerifier } from '../../src/lib/transaction-verifier';

describe('ContributionsService On-Chain Verification & Anti-Inflation', () => {
  const testMember = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects fraudulent contribution with fake or unverified tx_hash without granting reputation', async () => {
    const fakeHash = 'f'.repeat(64);

    vi.spyOn(transactionVerifier, 'verifyTransaction').mockResolvedValue({
      verified: false,
      error: 'Transaction not found on Stellar network'
    });

    const incrementSpy = vi.spyOn(profilesRepository, 'incrementPunctualContributions');

    await expect(
      contributionsService.recordContribution({
        circle_id: 1,
        cycle_index: 0,
        member_address: testMember,
        amount: 100,
        tx_hash: fakeHash
      })
    ).rejects.toThrow('On-chain transaction verification failed');

    // Crucial: reputation must NOT be incremented!
    expect(incrementSpy).not.toHaveBeenCalled();
  });

  it('grants reputation and creates verified contribution when tx_hash is confirmed on-chain', async () => {
    const validHash = 'a'.repeat(64);

    vi.spyOn(transactionVerifier, 'verifyTransaction').mockResolvedValue({
      verified: true,
      ledger: 12345
    });

    const createSpy = vi.spyOn(contributionsRepository, 'create').mockResolvedValue({
      id: 'mock-uuid',
      circle_id: 1n,
      cycle_index: 0,
      member_address: testMember,
      amount: 100,
      status: 'verified',
      tx_hash: validHash,
      paid_at: new Date().toISOString()
    } as any);

    const incrementSpy = vi.spyOn(profilesRepository, 'incrementPunctualContributions').mockResolvedValue({ count: 1 } as any);

    const result = await contributionsService.recordContribution({
      circle_id: 1,
      cycle_index: 0,
      member_address: testMember,
      amount: 100,
      tx_hash: validHash
    });

    expect(result.status).toBe('verified');
    expect(result.verified_on_chain).toBe(true);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'verified',
        tx_hash: validHash
      })
    );
    expect(incrementSpy).toHaveBeenCalledWith(testMember);
  });

  it('does not increment reputation when contribution is recorded without a tx_hash', async () => {
    vi.spyOn(contributionsRepository, 'create').mockResolvedValue({
      id: 'mock-uuid',
      circle_id: 1n,
      cycle_index: 0,
      member_address: testMember,
      amount: 100,
      status: 'paid',
      tx_hash: null,
      paid_at: new Date().toISOString()
    } as any);

    const incrementSpy = vi.spyOn(profilesRepository, 'incrementPunctualContributions');

    const result = await contributionsService.recordContribution({
      circle_id: 1,
      cycle_index: 0,
      member_address: testMember,
      amount: 100
      // No tx_hash provided
    });

    expect(result.status).toBe('paid');
    expect(result.verified_on_chain).toBe(false);
    expect(incrementSpy).not.toHaveBeenCalled();
  });
});

