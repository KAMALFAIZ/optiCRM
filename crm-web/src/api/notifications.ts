import apiClient from './client';
import type { Notification } from '@/types/notification';

const notificationsApi = {
  getAll: async (page = 1, size = 20): Promise<{ content: Notification[]; totalElements: number }> => {
    const res = await apiClient.get('/notifications', { params: { page, size } });
    const data = res.data.data ?? [];
    const meta = res.data.meta ?? {};
    return { content: data, totalElements: meta.total ?? data.length };
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data.data?.count ?? 0;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};

export default notificationsApi;
