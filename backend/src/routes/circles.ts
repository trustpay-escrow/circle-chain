import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { circlesService } from '../services/circles.service';
import { CreateCircleSchema, GetCircleByIdSchema, JoinCircleSchema } from '../schema';
import { CreateCircleDto } from '../repositories/circles.repository';

export const circlesRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /api/circles
  server.get('/', async () => {
    const circles = await circlesService.getAllCircles();
    return { success: true, circles };
  });

  // GET /api/circles/:id
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

  // POST /api/circles
  server.post<{ Body: CreateCircleDto }>(
    '/',
    { schema: CreateCircleSchema },
    async (req, reply) => {
      const created = await circlesService.createCircle(req.body);
      return reply.status(201).send({ success: true, circle: created });
    }
  );

  // POST /api/circles/:id/join
  server.post<{ Params: { id: string }; Body: { wallet_address: string; collateral_staked?: number } }>(
    '/:id/join',
    { schema: JoinCircleSchema },
    async (req) => {
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
