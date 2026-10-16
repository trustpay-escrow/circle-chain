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

describe('Circles API Endpoints (/api/circles)', () => {
  it('GET /api/circles returns list of savings circles', async () => {
    const res = await fetch(`${baseUrl}/api/circles`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.circles)).toBe(true);
    expect(data.circles.length).toBeGreaterThan(0);

    const first = data.circles[0];
    expect(first).toHaveProperty('circle_id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('contribution_amount');
    expect(first).toHaveProperty('creator_address');
  });

  it('GET /api/circles/:id returns specific circle details', async () => {
    const res = await fetch(`${baseUrl}/api/circles/1`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.circle).toBeDefined();
    expect(data.circle.circle_id).toBe(1);
    expect(data.circle.name).toBe('Tech Founders Ajo Pool');
  });

  it('POST /api/circles validates required fields (name and creator_address)', async () => {
    const res = await fetch(`${baseUrl}/api/circles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing name and creator_address
        description: 'Incomplete circle test'
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Name and creator_address are required');
  });

  it('POST /api/circles creates a valid savings circle', async () => {
    const newCircle = {
      name: 'Nairobi Soroban Hackathon Circle',
      description: 'Collateral-backed group savings for Nairobi developers.',
      category: 'Community Guild',
      creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      contribution_amount: 150,
      interval_days: 14,
      member_count: 6,
      collateral_required: 75,
      payout_mode: 'Fixed'
    };

    const res = await fetch(`${baseUrl}/api/circles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCircle)
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.circle.name).toBe(newCircle.name);
    expect(data.circle.creator_address).toBe(newCircle.creator_address);
    expect(data.circle.status).toBe('Forming');
  });
});
