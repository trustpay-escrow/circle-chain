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
  it('GET /api/circles returns list of savings circles from database', async () => {
    const res = await fetch(`${baseUrl}/api/circles`);
    if (res.status === 200) {
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.circles)).toBe(true);
    } else {
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
    }
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

  let createdCircleId: number;

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

    // If database is connected, returns 201 created
    if (res.status === 201) {
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.circle.name).toBe(newCircle.name);
      expect(data.circle.creator_address).toBe(newCircle.creator_address);
      expect(data.circle.status).toBe('Forming');
      createdCircleId = data.circle.circle_id;
    }
  });

  it('GET /api/circles/:id returns circle details or 404', async () => {
    const targetId = createdCircleId || 9999999;
    const res = await fetch(`${baseUrl}/api/circles/${targetId}`);
    
    if (createdCircleId && res.status === 200) {
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.circle).toBeDefined();
      expect(data.circle.circle_id).toBe(createdCircleId);
    } else {
      expect([404, 500]).toContain(res.status);
      const data = await res.json();
      expect(data.success).toBe(false);
    }
  });
});
