import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { contributionsService } from '../services/contributions.service';
import { CreateContributionSchema, RecordPayoutSchema } from '../schema';
import { CreateContributionDto } from '../repositories/contributions.repository';

export const contributionsRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /api/contributions/:circleId
  server.get<{ Params: { circleId: string } }>('/:circleId', async (req, reply) => {
    const numericCircleId = parseInt(req.params.circleId, 10);
    if (isNaN(numericCircleId)) {
      return reply.status(400).send({
        success: false,
        statusCode: 400,
        reqId: req.id,
        error: 'Invalid circle ID parameter'
      });
    }

    const data = await contributionsService.getContributionsByCircle(numericCircleId);
    return { success: true, data };
  });

  // POST /api/contributions
  server.post<{ Body: CreateContributionDto }>(
    '/',
    { schema: CreateContributionSchema },
    async (req, reply) => {
      const created = await contributionsService.recordContribution(req.body);
      return reply.status(201).send({ success: true, data: created });
    }
  );

  // POST /api/contributions/payout
  server.post<{
    Body: { circle_id: string; cycle_index: number; recipient_address: string; total_pot?: number };
  }>(
    '/payout',
    { schema: RecordPayoutSchema },
    async (req) => {
      const { circle_id, cycle_index, recipient_address, total_pot } = req.body;
      const res = await contributionsService.recordPayout(
        parseInt(circle_id, 10),
        cycle_index,
        recipient_address,
        total_pot
      );
      return res;
    }
  );
};
