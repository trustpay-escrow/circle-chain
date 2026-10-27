import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { logger } from './logger';
import { config } from './config';
import { registerRequestIdHook } from './request-id';
import { registerMetricsHook } from './metrics';
import { registerErrorHandlers } from './error-handlers';

// Routes
import { rootRoutes } from './routes/root';
import { statusRoutes } from './routes/status';
import { circlesRoutes } from './routes/circles';
import { profilesRoutes } from './routes/profiles';
import { contributionsRoutes } from './routes/contributions';
import { notificationsRoutes } from './routes/notifications';

export interface BuildServerOptions {
  disableLogger?: boolean;
}

/**
 * App Factory Pattern
 * Returns a configured Fastify app instance without listening on network ports.
 * Allows instant, zero-conflict integration testing via app.inject().
 */
export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: options.disableLogger ? false : (logger as any)
  });

  // 1. Core Hooks & Tracing
  registerRequestIdHook(app);
  registerMetricsHook(app);

  // 2. Security & Global Plugins
  await app.register(cors, {
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // 3. OpenAPI / Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'CircleChain Enterprise API',
        description: 'Off-Chain Indexer & Notification Engine for Stellar Soroban Savings Circles',
        version: '0.1.0'
      },
      servers: [
        {
          url: `http://${config.HOST}:${config.PORT}`,
          description: 'Local development server'
        }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // 4. Global Error Handlers & Sensitive Redaction
  registerErrorHandlers(app);

  // 5. Mount Routes
  await app.register(rootRoutes);
  await app.register(statusRoutes);
  await app.register(circlesRoutes, { prefix: '/api/circles' });
  await app.register(profilesRoutes, { prefix: '/api/profiles' });
  await app.register(contributionsRoutes, { prefix: '/api/contributions' });
  await app.register(notificationsRoutes, { prefix: '/api/notifications' });

  return app;
}
