import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { useAuthStore } from '../stores/authStore';

export function useNotifications(page: number = 1, size: number = 20) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['notifications', page, size],
    queryFn: () => notificationsApi.getAll(page, size),
    enabled: isHydrated && !!accessToken,
  });
}

export function useUnreadCount() {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: isHydrated && !!accessToken ? 60 * 1000 : false,
    enabled: isHydrated && !!accessToken,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}
