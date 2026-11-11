import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { circlesService } from '../services/circles.service';
import { CreateCircleSchema, GetCircleByIdSchema, JoinCircleSchema, SlashDefaulterSchema } from '../schema';
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

  // POST /api/circles/:id/leave (Guarded by SEP-10 Wallet Authentication)
  server.post<{ Params: { id: string }; Body: { wallet_address: string } }>(
    '/:id/leave',
    { preHandler: [requireAuth] },
    async (req, reply) => {
      if (req.user?.address !== req.body.wallet_address) {
        return reply.status(403).send({
          success: false,
          statusCode: 403,
          reqId: req.id,
          error: `Forbidden: Authenticated wallet (${req.user?.address}) cannot leave on behalf of ${req.body.wallet_address}`
        });
      }

      const circleId = parseInt(req.params.id, 10);
      await circlesService.leaveCircle(circleId, req.body.wallet_address);
      return { success: true, message: `Member ${req.body.wallet_address} left Circle #${circleId}` };
    }
  );

  // POST /api/circles/:id/cancel (Guarded by SEP-10 Wallet Authentication)
  server.post<{ Params: { id: string } }>(
    '/:id/cancel',
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const circleId = parseInt(req.params.id, 10);
      const caller = req.user?.address;
      if (!caller) {
        return reply.status(401).send({
          success: false,
          statusCode: 401,
          reqId: req.id,
          error: 'Unauthorized'
        });
      }

      const updated = await circlesService.cancelCircle(circleId, caller);
      return { success: true, circle: updated };
    }
  );

  // POST /api/circles/:id/bids (Guarded by SEP-10 Wallet Authentication)
  server.post<{
    Params: { id: string };
    Body: { cycle_index: number; bidder_address: string; discount_amount: number };
  }>(
    '/:id/bids',
    { preHandler: [requireAuth] },
    async (req, reply) => {
      if (req.user?.address !== req.body.bidder_address) {
        return reply.status(403).send({
          success: false,
          statusCode: 403,
          reqId: req.id,
          error: `Forbidden: Authenticated wallet (${req.user?.address}) cannot submit a bid on behalf of ${req.body.bidder_address}`
        });
      }

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

      return {
        success: true,
        bid: {
          circle_id: circleId,
          cycle_index: req.body.cycle_index,
          bidder_address: req.body.bidder_address,
          discount_amount: req.body.discount_amount,
          submitted_at: new Date().toISOString()
        }
      };
    }
  );

  // POST /api/circles/:id/slash (Guarded by SEP-10 Wallet Authentication)
  server.post<{
    Params: { id: string };
    Body: { defaulter_address: string; cycle_index: number; caller_address?: string; tx_hash?: string };
  }>(
    '/:id/slash',
    { schema: SlashDefaulterSchema, preHandler: [requireAuth] },
    async (req, reply) => {
      const circleId = parseInt(req.params.id, 10);
      const caller = req.user?.address || req.body.caller_address;
      if (!caller) {
        return reply.status(401).send({
          success: false,
          statusCode: 401,
          reqId: req.id,
          error: 'Unauthorized'
        });
      }

      try {
        const result = await circlesService.slashDefaulter(
          circleId,
          req.body.defaulter_address,
          req.body.cycle_index,
          caller,
          req.body.tx_hash
        );
        return { success: true, result };
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          statusCode: 400,
          reqId: req.id,
          error: err.message || 'Failed to process collateral slashing'
        });
      }
    }
  );
};
