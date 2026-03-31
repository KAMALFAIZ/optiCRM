import { useQuery } from '@tanstack/react-query';
import reportsApi from '../api/reports';
import { useAuthStore } from '../stores/authStore';

export function useMyStats() {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['myStats'],
    queryFn: reportsApi.getMyStats,
    enabled: isHydrated && !!accessToken,
  });
}

export function useVisitStats() {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['visitStats'],
    queryFn: reportsApi.getVisitStats,
    enabled: isHydrated && !!accessToken,
  });
}
