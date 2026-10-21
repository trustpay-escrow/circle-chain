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

describe('Boundary & Edge-Case Failure Mode Tests', () => {
  const validWallet = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('Boundary 1: Circle creation rejects missing name or creator address', async () => {
    const res = await fetch(`${baseUrl}/api/circles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'No creator address provided',
        contribution_amount: 100
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Name and creator_address are required');
  });

  it('Boundary 2: Contribution route rejects payload missing cycle_index or amount', async () => {
    const res = await fetch(`${baseUrl}/api/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        circle_id: '1',
        member_address: validWallet
        // Missing cycle_index and amount
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('Boundary 3: Handles extreme contribution and collateral amounts without crashing', async () => {
    const largeCircle = {
      name: 'Whale ROSCA Pool',
      creator_address: validWallet,
      contribution_amount: 1_000_000_000,
      collateral_required: 500_000_000,
      interval_days: 365,
      member_count: 20
    };

    const res = await fetch(`${baseUrl}/api/circles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(largeCircle)
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.circle.contribution_amount).toBe(1_000_000_000);
  });

  it('Boundary 4: Notifications endpoint gracefully returns empty array for unregistered wallet', async () => {
    const randomAddress = 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR';
    const res = await fetch(`${baseUrl}/api/notifications/${randomAddress}`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.notifications)).toBe(true);
  });

  it('Boundary 5: Non-numeric circle ID in GET /api/circles/:id returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/api/circles/invalid-not-a-number`);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('Invalid circle ID parameter');
  });
});
