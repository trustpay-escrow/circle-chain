import { prisma } from '../db';
import { serializeData } from '../lib/serialization';

export interface CreateNotificationDto {
  wallet_address: string;
  circle_id: bigint | number | string;
  message: string;
  notification_type: string;
}

export class NotificationsRepository {
  async findByWallet(wallet: string, limit: number = 50) {
    const notifications = await prisma.notification.findMany({
      where: { wallet_address: wallet },
      orderBy: { created_at: 'desc' },
      take: limit
    });
    return serializeData(notifications || []);
  }

  async create(data: CreateNotificationDto) {
    const notification = await prisma.notification.create({
      data: {
        wallet_address: data.wallet_address,
        circle_id: BigInt(data.circle_id),
        message: data.message,
        notification_type: data.notification_type,
        is_read: false
      }
    });
    return serializeData(notification);
  }

  async createBatch(items: CreateNotificationDto[]) {
    return prisma.notification.createMany({
      data: items.map((i) => ({
        wallet_address: i.wallet_address,
        circle_id: BigInt(i.circle_id),
        message: i.message,
        notification_type: i.notification_type,
        is_read: false
      }))
    });
  }

  async findMembersByCircleId(circleId: bigint | number | string) {
    return prisma.circleMember.findMany({
      where: { circle_id: BigInt(circleId) },
      select: { wallet_address: true }
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
