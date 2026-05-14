import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, LeadsQueryParams } from '../api/leads';
import type { CreateLeadRequest, UpdateLeadRequest, ConvertLeadRequest } from '../types/lead';
import { useAuthStore } from '../stores/authStore';

export function useLeads(params: LeadsQueryParams = {}) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadRequest) => leadsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadRequest }) => leadsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); },
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConvertLeadRequest }) => leadsApi.convert(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}
