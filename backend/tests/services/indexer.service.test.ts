import { describe, it, expect, vi } from 'vitest';
import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanEventIndexer } from '../../src/services/indexer.service';
import { prisma } from '../../src/db';
import { profilesRepository } from '../../src/repositories/profiles.repository';

describe('SorobanEventIndexer Service', () => {
  const indexer = new SorobanEventIndexer('https://soroban-testnet.stellar.org', 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4', 5000);

  it('correctly parses raw Soroban RPC events using scValToNative', () => {
    const rawEvent = {
      id: '0000000001',
      txHash: 'c'.repeat(64),
      ledger: 50000,
      topic: [
        StellarSdk.nativeToScVal('cycle_pay', { type: 'symbol' }),
        StellarSdk.nativeToScVal(42n, { type: 'u64' })
      ],
      value: StellarSdk.nativeToScVal([
        'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ',
        1000000000n,
        1
      ])
    };

    const parsed = indexer.parseRawEvent(rawEvent);
    expect(parsed).not.toBeNull();
    expect(parsed?.eventName).toBe('cycle_pay');
    expect(parsed?.circleId).toBe(42n);
    expect(parsed?.txHash).toBe('c'.repeat(64));
    expect(Array.isArray(parsed?.data)).toBe(true);
  });

  it('handles cycle_pay event by recording verified contribution and incrementing reputation', async () => {
    const testMember = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';
    const testCircleId = 9999n;

    // Spy on prisma and profilesRepository
    const prismaCreateContrib = vi.spyOn(prisma.contribution, 'create').mockResolvedValue({
      id: 'test-uuid-contrib',
      circle_id: testCircleId,
      cycle_index: 0,
      member_address: testMember,
      amount: 100 as any,
      status: 'verified',
      tx_hash: 'd'.repeat(64),
      paid_at: new Date()
    } as any);

    const prismaRepLog = vi.spyOn(prisma.reputationLog, 'create').mockResolvedValue({} as any);
    const repSpy = vi.spyOn(profilesRepository, 'incrementPunctualContributions').mockResolvedValue({ count: 1 } as any);

    await indexer.processEvent({
      id: 'event-1',
      txHash: 'd'.repeat(64),
      ledger: 55555,
      eventName: 'cycle_pay',
      circleId: testCircleId,
      data: [testMember, 1000000000n, 0] // 100 tokens (100 * 10^7 stroops)
    });

    expect(prismaCreateContrib).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          circle_id: testCircleId,
          cycle_index: 0,
          member_address: testMember,
          status: 'verified'
        })
      })
    );

    expect(repSpy).toHaveBeenCalledWith(testMember);
    expect(prismaRepLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          wallet_address: testMember,
          event_type: 'onchain_contribution'
        })
      })
    );

    prismaCreateContrib.mockRestore();
    prismaRepLog.mockRestore();
    repSpy.mockRestore();
  });

  it('manages indexer lifecycle (start and stop)', () => {
    indexer.start();
    expect((indexer as any).isRunning).toBe(true);

    indexer.stop();
    expect((indexer as any).isRunning).toBe(false);
  });
});

