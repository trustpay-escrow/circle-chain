import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from './logger';
import { config } from './config';

export function registerErrorHandlers(server: FastifyInstance): void {
  // Global error handler
  server.setErrorHandler((error: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    const reqId = req.id;

    logger.error({
      err: error,
      reqId,
      url: req.url,
      method: req.method,
      statusCode
    }, `Error occurred handling ${req.method} ${req.url}`);

    // Fastify schema validation error
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        statusCode: 400,
        reqId,
        error: 'Validation failed',
        details: error.validation
      });
    }

    // Mask internal error details in production
    const isProduction = config.NODE_ENV === 'production';
    const message = isProduction && statusCode === 500
      ? 'An unexpected internal server error occurred.'
      : error.message;

    return reply.status(statusCode).send({
      success: false,
      statusCode,
      reqId,
      error: message
    });
  });

  // Not found handler
  server.setNotFoundHandler((req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      success: false,
      statusCode: 404,
      reqId: req.id,
      error: `Resource not found: ${req.method} ${req.url}`
    });
  });
}
