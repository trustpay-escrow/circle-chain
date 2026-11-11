import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server';
import { notificationsService } from '../../src/services/notifications.service';

describe('Notifications Routes (/api/notifications)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ disableLogger: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/notifications/:wallet returns notification list', async () => {
    const mockList = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        wallet_address: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFTGXDECOTQWNOOWTACQ6',
        circle_id: '1',
        message: 'Cycle #1 payout released to your wallet!',
        notification_type: 'payout_released',
        is_read: false,
        created_at: new Date().toISOString()
      }
    ];

    vi.spyOn(notificationsService, 'getUserNotifications').mockResolvedValueOnce(mockList as any);

    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications/GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFTGXDECOTQWNOOWTACQ6'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].notification_type).toBe('payout_released');
  });

  it('PATCH /api/notifications/:id/read marks notification as read', async () => {
    const mockUpdated = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      is_read: true
    };

    vi.spyOn(notificationsService, 'markAsRead').mockResolvedValueOnce(mockUpdated as any);

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/notifications/123e4567-e89b-12d3-a456-426614174000/read'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.notification.is_read).toBe(true);
  });

  it('POST /api/notifications/read-all marks all notifications for wallet as read', async () => {
    vi.spyOn(notificationsService, 'markAllAsRead').mockResolvedValueOnce({ count: 5 } as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications/read-all',
      payload: {
        wallet: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFTGXDECOTQWNOOWTACQ6'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.updatedCount).toBe(5);
  });

  it('POST /api/notifications/read-all rejects missing wallet parameter', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications/read-all',
      payload: {}
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('wallet is required');
  });
});

