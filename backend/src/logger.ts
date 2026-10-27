import pino from 'pino';
import { config } from './config';

const isDev = config.NODE_ENV === 'development';

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'private_key',
      '*.password',
      '*.token',
      '*.secret',
      '*.private_key'
    ],
    censor: '[REDACTED]'
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
