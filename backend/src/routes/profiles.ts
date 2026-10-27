import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { profilesRepository, UpsertProfileDto } from '../repositories/profiles.repository';
import { UpsertProfileSchema } from '../schema';

export const profilesRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /api/profiles/:wallet
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

  // POST /api/profiles
  server.post<{ Body: UpsertProfileDto }>(
    '/',
    { schema: UpsertProfileSchema },
    async (req) => {
      const profile = await profilesRepository.upsert(req.body);
      return { success: true, profile };
    }
  );
};
