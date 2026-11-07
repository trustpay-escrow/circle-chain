import { describe, it, expect, vi } from 'vitest';
import { TransactionVerifier } from '../../src/lib/transaction-verifier';

describe('TransactionVerifier', () => {
  const verifier = new TransactionVerifier();

  it('rejects invalid or malformed transaction hashes', async () => {
    const res1 = await verifier.verifyTransaction('');
    expect(res1.verified).toBe(false);
    expect(res1.error).toContain('missing');

    const res2 = await verifier.verifyTransaction('not-a-valid-64-char-hex-hash');
    expect(res2.verified).toBe(false);
    expect(res2.error).toContain('64-character hex string');

    const res3 = await verifier.verifyTransaction('123456');
    expect(res3.verified).toBe(false);
    expect(res3.error).toContain('64-character hex string');
  });

  it('rejects non-existent transactions on the Stellar network', async () => {
    // 64-char hex string that doesn't exist on ledger
    const fakeHash = 'e'.repeat(64);
    const res = await verifier.verifyTransaction(fakeHash);
    expect(res.verified).toBe(false);
    expect(res.error).toContain('could not be verified');
  });

  it('verifies successful transactions using mock Horizon response', async () => {
    const mockVerifier = new TransactionVerifier();
    const testHash = 'a'.repeat(64);
    const testMember = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';

    // Mock horizonServer
    (mockVerifier as any).horizonServer = {
      transactions: () => ({
        transaction: vi.fn().mockReturnValue({
          call: vi.fn().mockResolvedValue({
            successful: true,
            ledger_attr: 123456,
            created_at: '2026-11-07T10:00:00Z',
            fee_charged: '100',
            source_account: testMember
          })
        })
      })
    };

    const res = await mockVerifier.verifyTransaction(testHash, testMember);
    expect(res.verified).toBe(true);
    expect(res.ledger).toBe(123456);
  });

  it('rejects transactions where member account is not involved', async () => {
    const mockVerifier = new TransactionVerifier();
    const testHash = 'b'.repeat(64);
    const expectedMember = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';
    const unrelatedMember = 'GC5S6ZTV55F37QW2NYJ6NYLQLNOG2P3QMXGZ2PQV453B75NMN4R6S33D';

    (mockVerifier as any).horizonServer = {
      transactions: () => ({
        transaction: vi.fn().mockReturnValue({
          call: vi.fn().mockResolvedValue({
            successful: true,
            ledger_attr: 99999,
            created_at: '2026-11-07T10:00:00Z',
            fee_charged: '100',
            source_account: unrelatedMember,
            operations: vi.fn().mockResolvedValue({
              records: [
                {
                  source_account: unrelatedMember,
                  from: unrelatedMember,
                  to: 'GBKJJZKZRROE44G64MC6BC5NAUPTLAB5TY5TUEOB7ZKBP36WQK54KMOE'
                }
              ]
            })
          })
        })
      })
    };

    const res = await mockVerifier.verifyTransaction(testHash, expectedMember);
    expect(res.verified).toBe(false);
    expect(res.error).toContain('does not involve expected member account');
  });
});

