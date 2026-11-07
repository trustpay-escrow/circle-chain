import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { profilesRepository, UpsertProfileDto } from '../repositories/profiles.repository';
import { UpsertProfileSchema } from '../schema';
import { requireAuth } from '../lib/stellar-auth';

export const profilesRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /api/profiles/:wallet (Public read-only)
  server.get<{ Params: { wallet: string } }>('/:wallet', async (req, reply) => {
    const { wallet } = req.params;
    if (!wallet) {
      return reply.status(400).send({
        success: false,
        statusCode: 400,
        reqId: req.id,
        error: 'wallet parameter is required'
      });
    }

    const profile = await profilesRepository.findByWallet(wallet);
    return { success: true, profile };
  });

  // POST /api/profiles (Guarded by SEP-10 Wallet Authentication)
  server.post<{ Body: UpsertProfileDto }>(
    '/',
    { schema: UpsertProfileSchema, preHandler: [requireAuth] },
    async (req, reply) => {
      // Validate that authenticated wallet owns the profile being updated
      if (req.user?.address !== req.body.wallet_address) {
        return reply.status(403).send({
          success: false,
          statusCode: 403,
          reqId: req.id,
          error: `Forbidden: Authenticated wallet (${req.user?.address}) cannot modify profile for ${req.body.wallet_address}`
        });
      }

      const profile = await profilesRepository.upsert(req.body);
      return { success: true, profile };
    }
  );
};
