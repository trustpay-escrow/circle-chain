import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { circlesService } from '../services/circles.service';
import { CreateCircleSchema, GetCircleByIdSchema, JoinCircleSchema } from '../schema';
import { CreateCircleDto } from '../repositories/circles.repository';
import { requireAuth } from '../lib/stellar-auth';

export const circlesRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /api/circles (Public read-only)
  server.get('/', async () => {
    const circles = await circlesService.getAllCircles();
    return { success: true, circles };
  });

  // GET /api/circles/:id (Public read-only)
  server.get<{ Params: { id: string } }>(
    '/:id',
    { schema: GetCircleByIdSchema },
    async (req, reply) => {
      const circleId = parseInt(req.params.id, 10);
      const circle = await circlesService.getCircleById(circleId);

      if (!circle) {
        return reply.status(404).send({
          success: false,
          statusCode: 404,
          reqId: req.id,
          error: `Circle #${circleId} not found`
        });
      }

      return { success: true, circle };
    }
  );

  // POST /api/circles (Guarded by SEP-10 Wallet Authentication)
  server.post<{ Body: CreateCircleDto }>(
    '/',
    { schema: CreateCircleSchema, preHandler: [requireAuth] },
    async (req, reply) => {
      // Validate that authenticated wallet matches creator_address
      if (req.user?.address !== req.body.creator_address) {
        return reply.status(403).send({
          success: false,
          statusCode: 403,
          reqId: req.id,
          error: `Forbidden: Authenticated wallet (${req.user?.address}) cannot create a circle on behalf of ${req.body.creator_address}`
        });
      }

      const created = await circlesService.createCircle(req.body);
      return reply.status(201).send({ success: true, circle: created });
    }
  );

  // POST /api/circles/:id/join (Guarded by SEP-10 Wallet Authentication)
  server.post<{ Params: { id: string }; Body: { wallet_address: string; collateral_staked?: number } }>(
    '/:id/join',
    { schema: JoinCircleSchema, preHandler: [requireAuth] },
    async (req, reply) => {
      // Validate that authenticated wallet matches wallet_address joining the circle
      if (req.user?.address !== req.body.wallet_address) {
        return reply.status(403).send({
          success: false,
          statusCode: 403,
          reqId: req.id,
          error: `Forbidden: Authenticated wallet (${req.user?.address}) cannot join a circle on behalf of ${req.body.wallet_address}`
        });
      }

      const circleId = parseInt(req.params.id, 10);
      const member = await circlesService.joinCircle(
        circleId,
        req.body.wallet_address,
        req.body.collateral_staked
      );
      return { success: true, member };
    }
  );
};
