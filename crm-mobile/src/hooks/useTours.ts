import { useQuery } from '@tanstack/react-query';
import toursApi, { ToursQueryParams } from '../api/tours';
import { useAuthStore } from '../stores/authStore';

export function useTours(params: ToursQueryParams = {}) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['tours', params],
    queryFn: () => toursApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useTour(id: string) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['tour', id],
    queryFn: () => toursApi.getById(id),
    enabled: isHydrated && !!accessToken && !!id,
  });
}
