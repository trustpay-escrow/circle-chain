import { FastifyInstance } from 'fastify';
import { disconnectDatabase } from './db';
import { logger } from './logger';

export function registerShutdownHandlers(server: FastifyInstance): void {
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, `Received ${signal}. Starting graceful shutdown...`);

    const timeout = setTimeout(() => {
      logger.error('Shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000);

    try {
      logger.info('Closing HTTP server and stopping incoming requests...');
      await server.close();
      logger.info('HTTP server closed.');

      logger.info('Disconnecting database client...');
      await disconnectDatabase();

      clearTimeout(timeout);
      logger.info('Graceful shutdown completed successfully.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error occurred during graceful shutdown.');
      clearTimeout(timeout);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Promise Rejection detected');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception detected, exiting');
    process.exit(1);
  });
}
