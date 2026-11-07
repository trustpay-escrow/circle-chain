import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import * as StellarSdk from '@stellar/stellar-sdk';
import { buildServer } from '../../src/server';
import { issueAuthToken } from '../../src/lib/stellar-auth';

describe('Stellar SEP-10 Authentication Routes (/api/auth)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ disableLogger: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/auth/challenge rejects missing or invalid address', async () => {
    const resNoAddr = await app.inject({
      method: 'GET',
      url: '/api/auth/challenge'
    });
    expect(resNoAddr.statusCode).toBe(400);

    const resInvalid = await app.inject({
      method: 'GET',
      url: '/api/auth/challenge?address=INVALID_ADDRESS_G123'
    });
    expect(resInvalid.statusCode).toBe(400);
  });

  it('GET /api/auth/challenge generates valid challenge transaction XDR', async () => {
    const clientKeypair = StellarSdk.Keypair.random();
    const res = await app.inject({
      method: 'GET',
      url: `/api/auth/challenge?address=${clientKeypair.publicKey()}`
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(typeof body.transaction).toBe('string');
    expect(body.transaction.length).toBeGreaterThan(50);
    expect(body.server_public_key.startsWith('G')).toBe(true);
    expect(body.domain).toBe('circlechain.app');
  });

  it('POST /api/auth/verify verifies signed challenge, issues JWT, and rejects replay attack', async () => {
    const clientKeypair = StellarSdk.Keypair.random();

    // 1. Request challenge
    const challengeRes = await app.inject({
      method: 'GET',
      url: `/api/auth/challenge?address=${clientKeypair.publicKey()}`
    });
    expect(challengeRes.statusCode).toBe(200);
    const { transaction: challengeXdr, network_passphrase } = challengeRes.json();

    // 2. Client signs challenge with wallet keypair
    const tx = new StellarSdk.Transaction(challengeXdr, network_passphrase);
    tx.sign(clientKeypair);
    const signedXdr = tx.toXDR();

    // 3. Verify signed challenge
    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify',
      payload: { transaction: signedXdr }
    });

    expect(verifyRes.statusCode).toBe(200);
    const verifyBody = verifyRes.json();
    expect(verifyBody.success).toBe(true);
    expect(verifyBody.address).toBe(clientKeypair.publicKey());
    expect(typeof verifyBody.token).toBe('string');
    expect(verifyBody.expires_in).toBe(86400);

    // 4. Anti-replay verification: attempting to reuse same challenge must be rejected
    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify',
      payload: { transaction: signedXdr }
    });
    expect(replayRes.statusCode).toBe(401);
    expect(replayRes.json().error).toContain('replay detected');
  });

  it('POST /api/auth/verify rejects challenge signed with wrong key', async () => {
    const clientKeypair = StellarSdk.Keypair.random();
    const wrongKeypair = StellarSdk.Keypair.random();

    const challengeRes = await app.inject({
      method: 'GET',
      url: `/api/auth/challenge?address=${clientKeypair.publicKey()}`
    });
    const { transaction: challengeXdr, network_passphrase } = challengeRes.json();

    const tx = new StellarSdk.Transaction(challengeXdr, network_passphrase);
    tx.sign(wrongKeypair); // Signed by wrong key!

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify',
      payload: { transaction: tx.toXDR() }
    });

    expect(verifyRes.statusCode).toBe(401);
  });

  it('GET /api/auth/me requires authentication and returns authenticated wallet', async () => {
    // Without token -> 401
    const unauthRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me'
    });
    expect(unauthRes.statusCode).toBe(401);

    // With valid token -> 200
    const clientKeypair = StellarSdk.Keypair.random();
    const { token } = issueAuthToken(clientKeypair.publicKey());

    const authRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(authRes.statusCode).toBe(200);
    expect(authRes.json()).toEqual({
      success: true,
      address: clientKeypair.publicKey()
    });
  });

  describe('Route Protection & Ownership Checks', () => {
    it('POST /api/profiles rejects unauthenticated calls and wallet mismatch', async () => {
      const walletA = StellarSdk.Keypair.random().publicKey();
      const walletB = StellarSdk.Keypair.random().publicKey();

      // 1. Unauthenticated -> 401
      const unauthRes = await app.inject({
        method: 'POST',
        url: '/api/profiles',
        payload: {
          wallet_address: walletA,
          display_name: 'Attacker'
        }
      });
      expect(unauthRes.statusCode).toBe(401);

      // 2. Authenticated as walletA but trying to update walletB -> 403 Forbidden
      const { token: tokenA } = issueAuthToken(walletA);
      const forbiddenRes = await app.inject({
        method: 'POST',
        url: '/api/profiles',
        headers: {
          authorization: `Bearer ${tokenA}`
        },
        payload: {
          wallet_address: walletB,
          display_name: 'Impersonated User'
        }
      });
      expect(forbiddenRes.statusCode).toBe(403);
      expect(forbiddenRes.json().error).toContain('Forbidden');
    });

    it('POST /api/contributions rejects unauthenticated calls and wallet mismatch', async () => {
      const memberA = StellarSdk.Keypair.random().publicKey();
      const memberB = StellarSdk.Keypair.random().publicKey();

      // 1. Unauthenticated -> 401
      const unauthRes = await app.inject({
        method: 'POST',
        url: '/api/contributions',
        payload: {
          circle_id: '1',
          cycle_index: 0,
          member_address: memberA,
          amount: 100
        }
      });
      expect(unauthRes.statusCode).toBe(401);

      // 2. Authenticated as memberA but submitting contribution for memberB -> 403
      const { token: tokenA } = issueAuthToken(memberA);
      const forbiddenRes = await app.inject({
        method: 'POST',
        url: '/api/contributions',
        headers: {
          authorization: `Bearer ${tokenA}`
        },
        payload: {
          circle_id: '1',
          cycle_index: 0,
          member_address: memberB,
          amount: 100
        }
      });
      expect(forbiddenRes.statusCode).toBe(403);
    });

    it('POST /api/circles rejects unauthenticated calls and creator mismatch', async () => {
      const creatorA = StellarSdk.Keypair.random().publicKey();
      const creatorB = StellarSdk.Keypair.random().publicKey();

      // 1. Unauthenticated -> 401
      const unauthRes = await app.inject({
        method: 'POST',
        url: '/api/circles',
        payload: {
          name: 'Test Circle',
          creator_address: creatorA
        }
      });
      expect(unauthRes.statusCode).toBe(401);

      // 2. Authenticated as creatorA but setting creator_address to creatorB -> 403
      const { token: tokenA } = issueAuthToken(creatorA);
      const forbiddenRes = await app.inject({
        method: 'POST',
        url: '/api/circles',
        headers: {
          authorization: `Bearer ${tokenA}`
        },
        payload: {
          name: 'Test Circle',
          creator_address: creatorB
        }
      });
      expect(forbiddenRes.statusCode).toBe(403);
    });
  });
});

