import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server';
import { mockCircleInput, mockInvalidStellarAddress } from '../fixtures/mock-data';

describe('Circles Routes (/api/circles)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ disableLogger: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/circles rejects payload with missing required name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/circles',
      payload: {
        creator_address: mockCircleInput.creator_address
        // Missing name
      }
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation failed');
  });

  it('POST /api/circles rejects invalid Stellar creator address', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/circles',
      payload: {
        name: 'Invalid Address Test',
        creator_address: mockInvalidStellarAddress
      }
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
  });

  it('GET /api/circles/:id validates numeric ID format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/circles/abc-not-a-number'
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
  });
});
