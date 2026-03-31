import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitsApi, VisitsQueryParams } from '../api/visits';
import type { CreateVisitRequest, UpdateVisitRequest } from '../types/visit';
import { useAuthStore } from '../stores/authStore';

export function useVisits(params: VisitsQueryParams = {}) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['visits', params],
    queryFn: () => visitsApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useVisit(id: string) {
  return useQuery({
    queryKey: ['visits', id],
    queryFn: () => visitsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVisitRequest) => visitsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, latitude, longitude }: { id: string; latitude?: number; longitude?: number }) =>
      visitsApi.checkIn(id, latitude, longitude),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes, outcome }: { id: string; notes?: string; outcome?: string }) =>
      visitsApi.checkOut(id, notes, outcome),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); },
  });
}
