import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { config } from './config';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      config.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' }
          ]
        : [{ emit: 'event', level: 'error' }]
  });

if (config.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

if (config.NODE_ENV === 'development') {
  // @ts-expect-error Prisma event typing
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.debug({ query: e.query, durationMs: e.duration }, 'Database Query Executed');
  });
}

// @ts-expect-error Prisma event typing
prisma.$on('error', (e: { message: string }) => {
  logger.error({ err: e.message }, 'Prisma Database Error');
});

/**
 * Validates database connectivity with a 1.5s timeout probe.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB health probe timed out')), 1500)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    return true;
  } catch (err) {
    logger.warn({ err }, 'Database health check failed');
    return false;
  }
}

/**
 * Disconnects the database client safely.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected cleanly');
  } catch (err) {
    logger.error({ err }, 'Error during database disconnection');
  }
}
