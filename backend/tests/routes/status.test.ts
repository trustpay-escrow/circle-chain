import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server';

describe('Status & Health Routes (/health, /live, /ready, /metrics)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ disableLogger: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /live returns 200 alive without requiring DB', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/live'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('alive');
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /metrics returns memory and request telemetry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/metrics'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.memory).toBeDefined();
    expect(body.memory.heapUsedMb).toBeGreaterThan(0);
    expect(typeof body.totalRequests).toBe('number');
  });

  it('Propagates x-request-id correlation header in responses', async () => {
    const customId = 'test-correlation-id-456';
    const res = await app.inject({
      method: 'GET',
      url: '/live',
      headers: {
        'x-request-id': customId
      }
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-request-id']).toBe(customId);
  });
});
