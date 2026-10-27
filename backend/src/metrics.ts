import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

interface MetricsState {
  totalRequests: number;
  totalErrors: number;
  startTime: number;
  statusCodes: Record<number, number>;
}

const state: MetricsState = {
  totalRequests: 0,
  totalErrors: 0,
  startTime: Date.now(),
  statusCodes: {}
};

export function registerMetricsHook(server: FastifyInstance): void {
  server.addHook('onRequest', async () => {
    state.totalRequests += 1;
  });

  server.addHook('onResponse', async (_req: FastifyRequest, reply: FastifyReply) => {
    const code = reply.statusCode;
    state.statusCodes[code] = (state.statusCodes[code] || 0) + 1;
    if (code >= 400) {
      state.totalErrors += 1;
    }
  });
}

export function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  return {
    uptimeSeconds: Math.floor((Date.now() - state.startTime) / 1000),
    totalRequests: state.totalRequests,
    totalErrors: state.totalErrors,
    statusCodes: state.statusCodes,
    memory: {
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100
    },
    nodeVersion: process.version,
    platform: process.platform
  };
}
