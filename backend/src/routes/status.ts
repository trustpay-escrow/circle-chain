import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { checkDatabaseHealth } from '../db';
import { getSystemMetrics } from '../metrics';

export const statusRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Comprehensive health check
  server.get('/health', async () => {
    const dbOk = await checkDatabaseHealth();
    return {
      status: dbOk ? 'ok' : 'degraded',
      service: 'CircleChain Off-Chain Indexer & Notification Engine',
      database: dbOk ? 'connected' : 'disconnected',
      engine: 'Prisma ORM + PostgreSQL 16',
      timestamp: new Date().toISOString()
    };
  });

  server.get('/healthz', async () => {
    const dbOk = await checkDatabaseHealth();
    return {
      status: dbOk ? 'healthy' : 'unhealthy',
      database: dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    };
  });

  // Liveness probe (Kubernetes / container orchestrator)
  server.get('/live', async () => {
    return { status: 'alive', uptime: process.uptime() };
  });

  server.get('/health/liveness', async () => {
    return { status: 'alive', uptime: process.uptime() };
  });

  // Readiness probe
  server.get('/ready', async (_req, reply) => {
    const dbHealthy = await checkDatabaseHealth();
    if (!dbHealthy) {
      return reply.status(503).send({
        status: 'not_ready',
        database: 'disconnected'
      });
    }
    return {
      status: 'ready',
      database: 'healthy'
    };
  });

  server.get('/health/readiness', async (_req, reply) => {
    const dbHealthy = await checkDatabaseHealth();
    if (!dbHealthy) {
      return reply.status(503).send({
        status: 'not_ready',
        database: 'disconnected'
      });
    }
    return {
      status: 'ready',
      database: 'healthy'
    };
  });

  // Metrics endpoint
  server.get('/metrics', async () => {
    return getSystemMetrics();
  });
};
