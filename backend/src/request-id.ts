import { randomUUID } from 'crypto';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export const REQUEST_ID_HEADER = 'x-request-id';

export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Register request ID plugin/hook to correlate incoming requests across logs.
 */
export function registerRequestIdHook(server: FastifyInstance): void {
  server.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    const existingId = req.headers[REQUEST_ID_HEADER] as string | undefined;
    const reqId = existingId || generateRequestId();
    req.id = reqId;
    reply.header(REQUEST_ID_HEADER, reqId);
  });
}
