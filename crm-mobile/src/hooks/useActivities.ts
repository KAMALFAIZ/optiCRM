import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi, ActivitiesQueryParams } from '../api/activities';
import type { CreateActivityRequest, UpdateActivityRequest } from '../types/activity';
import { useAuthStore } from '../stores/authStore';

export function useActivities(params: ActivitiesQueryParams = {}) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => activitiesApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: () => activitiesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityRequest) => activitiesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); },
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityRequest }) => activitiesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); },
  });
}

export function useCompleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesApi.complete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); },
  });
}
