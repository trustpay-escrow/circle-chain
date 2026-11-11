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

  // PATCH /api/notifications/:id/read
  server.patch<{ Params: { id: string } }>('/:id/read', async (req, reply) => {
    const updated = await notificationsService.markAsRead(req.params.id);
    return { success: true, notification: updated };
  });

  // POST /api/notifications/read-all
  server.post<{ Body: { wallet: string } }>('/read-all', async (req, reply) => {
    const { wallet } = req.body || {};
    if (!wallet) {
      return reply.status(400).send({
        success: false,
        statusCode: 400,
        reqId: req.id,
        error: 'wallet is required'
      });
    }
    const result = await notificationsService.markAllAsRead(wallet);
    return { success: true, updatedCount: result.count };
  });
};
