import { buildServer } from './server';
import { config } from './config';
import { logger } from './logger';
import { registerShutdownHandlers } from './shutdown';
import { checkDatabaseHealth } from './db';

async function bootstrap() {
  try {
    const server = await buildServer();

    // Register OS termination signal handlers (SIGINT/SIGTERM)
    registerShutdownHandlers(server);

    // Verify database connectivity during bootstrap
    const dbHealthy = await checkDatabaseHealth();
    if (dbHealthy) {
      logger.info('Database connection established successfully.');
    } else {
      logger.warn('Initial database connection probe failed. Will retry on demand.');
    }

    // Start listening on configured port & host
    await server.listen({
      port: config.PORT,
      host: config.HOST
    });

    logger.info(
      `🚀 CircleChain Fastify Server running at http://${config.HOST}:${config.PORT} (Docs: http://${config.HOST}:${config.PORT}/docs)`
    );
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server bootstrap');
    process.exit(1);
  }
}

bootstrap();
