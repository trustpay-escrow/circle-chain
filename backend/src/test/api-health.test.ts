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

describe('API Health Probes (Liveness & Readiness)', () => {
  it('GET /health returns service status and engine specification', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.service).toContain('CircleChain');
    expect(data.engine).toBe('Prisma ORM + PostgreSQL 16');
    expect(data.timestamp).toBeDefined();
  });

  it('GET /health/liveness returns status alive and positive uptime', async () => {
    const res = await fetch(`${baseUrl}/health/liveness`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('alive');
    expect(data.uptime).toBeGreaterThan(0);
  });

  it('GET /health/readiness responds with ready status', async () => {
    const res = await fetch(`${baseUrl}/health/readiness`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ready');
    expect(['healthy', 'disconnected']).toContain(data.database);
  });
});
