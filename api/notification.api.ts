import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';

export const notificationApi = {
  fetchNotifications: () =>
    unwrap<Array<{ id: string; title: string; body: string; isRead: boolean; createdAt: string }>>(
      api.get(ENDPOINTS.CUSTOMER.NOTIFICATIONS.BASE),
    ),

  markNotificationRead: (id: string) =>
    unwrap(api.patch(ENDPOINTS.CUSTOMER.NOTIFICATIONS.READ(id))),
};
