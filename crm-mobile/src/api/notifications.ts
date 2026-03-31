import apiClient from './client';
import type { ApiResponse, PagedResponse } from '../types/api';
import type { Notification } from '../types/notification';

export const notificationsApi = {
  getAll: async (page: number = 1, size: number = 20): Promise<PagedResponse<Notification>> => {
    const response = await apiClient.get<ApiResponse<Notification[]>>('/notifications', {
      params: { page, perPage: size },
    });
    const meta = response.data.meta;
    const p = meta?.page || 0;
    const s = meta?.perPage || meta?.size || 20;
    const totalElements = meta?.total || meta?.totalElements || 0;
    const totalPages = meta?.totalPages || 0;
    return { content: response.data.data || [], page: p, size: s, totalElements, totalPages, meta: { page: p, size: s, totalElements, totalPages } };
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/notifications/unread-count');
    return response.data.data!;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
