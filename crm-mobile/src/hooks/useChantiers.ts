import { useQuery } from '@tanstack/react-query';
import chantiersApi, { ChantiersQueryParams } from '../api/chantiers';
import { useAuthStore } from '../stores/authStore';

export function useChantiers(params: ChantiersQueryParams = {}) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['chantiers', params],
    queryFn: () => chantiersApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useChantier(id: string) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['chantier', id],
    queryFn: () => chantiersApi.getById(id),
    enabled: isHydrated && !!accessToken && !!id,
  });
}
