import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { notificationsService } from '../services/notifications.service';
import { CreateNotificationSchema } from '../schema';
import { CreateNotificationDto } from '../repositories/notifications.repository';

export const notificationsRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // GET /api/notifications/:wallet
  server.get<{ Params: { wallet: string } }>('/:wallet', async (req) => {
    const notifications = await notificationsService.getUserNotifications(req.params.wallet);
    return { success: true, notifications };
  });

  // POST /api/notifications
  server.post<{ Body: CreateNotificationDto }>(
    '/',
    { schema: CreateNotificationSchema },
    async (req, reply) => {
      const notification = await notificationsService.sendNotification(req.body);
      return reply.status(201).send({ success: true, notification });
    }
  );

  // POST /api/notifications/remind
  server.post<{ Body: { circleId: number | string; cycleIndex?: number } }>(
    '/remind',
    async (req, reply) => {
      const { circleId, cycleIndex } = req.body;
      if (!circleId) {
        return reply.status(400).send({
          success: false,
          statusCode: 400,
          reqId: req.id,
          error: 'circleId is required'
        });
      }

      const result = await notificationsService.triggerDueReminders(
        typeof circleId === 'string' ? parseInt(circleId, 10) : circleId,
        cycleIndex
      );

      return {
        success: true,
        message: `Off-chain notifications queued (${result.count} dispatched) for Circle #${circleId}`
      };
    }
  );
};
