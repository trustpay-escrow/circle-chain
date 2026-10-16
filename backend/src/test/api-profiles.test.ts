import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../server';
import http from 'http';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as any;
      baseUrl = `http://localhost:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Profiles API Endpoints (/api/profiles)', () => {
  const testWallet = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('GET /api/profiles/:wallet returns profile data with fallback reputation', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/${testWallet}`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.profile).toBeDefined();
    expect(data.profile.wallet_address).toBe(testWallet);
    expect(data.profile.reputation_score).toBeGreaterThanOrEqual(90);
  });

  it('POST /api/profiles requires wallet_address', async () => {
    const res = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'anonymous_saver'
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('wallet_address is required');
  });

  it('POST /api/profiles upserts profile data and sanitizes @ handles', async () => {
    const profilePayload = {
      wallet_address: testWallet,
      username: '@stellar_pioneer',
      display_name: 'Pioneer Stellar',
      bio: 'Decentralized credit builder',
      reputation_score: 99
    };

    const res = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profilePayload)
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.profile.wallet_address).toBe(testWallet);
    // Verified @ is stripped
    expect(data.profile.username).toBe('stellar_pioneer');
    expect(data.profile.display_name).toBe('Pioneer Stellar');
  });
});
