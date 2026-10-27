import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server';

describe('Server App Factory & Lifecycle Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ disableLogger: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Root endpoint GET / returns service information and OpenAPI docs link', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.service).toContain('CircleChain');
    expect(body.status).toBe('operational');
    expect(body.documentation).toBe('/docs');
  });

  it('Returns 404 with standardized error envelope for non-existent route', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/non-existent-endpoint'
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(404);
    expect(body.error).toContain('Resource not found');
    expect(body.reqId).toBeDefined();
  });

  it('CORS headers are properly applied', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/circles',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'GET'
      }
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
