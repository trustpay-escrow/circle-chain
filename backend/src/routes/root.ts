import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const rootRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/', async () => {
    return {
      service: 'CircleChain Off-Chain Indexer & Notification Engine',
      version: '0.1.0',
      status: 'operational',
      documentation: '/docs',
      timestamp: new Date().toISOString()
    };
  });
};
