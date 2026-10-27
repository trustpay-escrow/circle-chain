import { notificationsRepository, CreateNotificationDto } from '../repositories/notifications.repository';

export class NotificationsService {
  async getUserNotifications(wallet: string) {
    return notificationsRepository.findByWallet(wallet);
  }

  async sendNotification(dto: CreateNotificationDto) {
    return notificationsRepository.create(dto);
  }

  async triggerDueReminders(circleId: number, cycleIndex: number = 0) {
    const members = await notificationsRepository.findMembersByCircleId(circleId);
    if (!members || members.length === 0) {
      return { count: 0 };
    }

    const items = members.map((m: { wallet_address: string }) => ({
      wallet_address: m.wallet_address,
      circle_id: circleId,
      message: `Reminder: Contribution for Cycle ${cycleIndex + 1} is due soon!`,
      notification_type: 'contribution_due'
    }));

    await notificationsRepository.createBatch(items);
    return { count: items.length };
  }
}

export const notificationsService = new NotificationsService();
