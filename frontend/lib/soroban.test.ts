import { describe, it, expect, vi } from 'vitest';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  CONTRACT_ID,
  NETWORK_PASSPHRASE,
  BASE_FEE,
  getSorobanServer,
  fundWithFriendbot
} from './soroban';

describe('Soroban Contract Service & Config', () => {
  it('exports valid default network passphrase and base fee', () => {
    expect(NETWORK_PASSPHRASE).toBe(StellarSdk.Networks.TESTNET);
    expect(BASE_FEE).toBe('10000');
  });

  it('provides a valid 56-character C-prefixed contract ID', () => {
    expect(CONTRACT_ID.startsWith('C')).toBe(true);
    expect(CONTRACT_ID.length).toBe(56);
  });

  it('initializes SorobanRpc.Server instance without throwing', () => {
    const server = getSorobanServer();
    expect(server).toBeDefined();
    expect(typeof server.getTransaction).toBe('function');
    expect(typeof server.sendTransaction).toBe('function');
  });

  it('attempts friendbot funding on testnet', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    } as any);

    const testAddr = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';
    const result = await fundWithFriendbot(testAddr);
    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('friendbot.stellar.org?addr=' + encodeURIComponent(testAddr))
    );

    fetchSpy.mockRestore();
  });
});

