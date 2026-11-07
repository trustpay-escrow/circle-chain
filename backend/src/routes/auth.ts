import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  buildSep10Challenge,
  verifySep10Challenge,
  issueAuthToken,
  requireAuth
} from '../lib/stellar-auth';
import { isValidStellarPublicKey } from '../lib/stellar-validator';
import {
  GetAuthChallengeSchema,
  VerifyAuthChallengeSchema,
  GetAuthMeSchema
} from '../schema';

export const authRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /api/auth/challenge?address=G...
  server.get<{ Querystring: { address: string } }>(
    '/challenge',
    { schema: GetAuthChallengeSchema },
    async (req, reply) => {
      const { address } = req.query;

      if (!address || !isValidStellarPublicKey(address)) {
        return reply.status(400).send({
          success: false,
          statusCode: 400,
          reqId: req.id,
          error: 'A valid Stellar Ed25519 public key (starts with G, 56 chars) is required'
        });
      }

      try {
        const challenge = buildSep10Challenge(address);
        return {
          success: true,
          ...challenge
        };
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          statusCode: 400,
          reqId: req.id,
          error: err.message || 'Failed to generate SEP-10 challenge'
        });
      }
    }
  );

  // POST /api/auth/verify
  server.post<{ Body: { transaction?: string; xdr?: string } }>(
    '/verify',
    { schema: VerifyAuthChallengeSchema },
    async (req, reply) => {
      const signedXdr = req.body?.transaction || req.body?.xdr;

      if (!signedXdr || typeof signedXdr !== 'string') {
        return reply.status(400).send({
          success: false,
          statusCode: 400,
          reqId: req.id,
          error: 'Signed challenge transaction XDR is required in request body'
        });
      }

      try {
        const { address } = verifySep10Challenge(signedXdr);
        const { token, expires_in } = issueAuthToken(address);

        return reply.status(200).send({
          success: true,
          token,
          address,
          expires_in
        });
      } catch (err: any) {
        return reply.status(401).send({
          success: false,
          statusCode: 401,
          reqId: req.id,
          error: `SEP-10 signature verification failed: ${err.message}`
        });
      }
    }
  );

  // GET /api/auth/me
  server.get(
    '/me',
    { schema: GetAuthMeSchema, preHandler: [requireAuth] },
    async (req) => {
      return {
        success: true,
        address: req.user!.address
      };
    }
  );
};

