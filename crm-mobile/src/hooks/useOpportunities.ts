import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi, OpportunitiesQueryParams } from '../api/opportunities';
import type { CreateOpportunityRequest, UpdateOpportunityRequest } from '../types/opportunity';
import { useAuthStore } from '../stores/authStore';

export function useOpportunities(params: OpportunitiesQueryParams = {}) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['opportunities', params],
    queryFn: () => opportunitiesApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => opportunitiesApi.getById(id),
    enabled: !!id,
  });
}

export function useOpportunityStages() {
  return useQuery({
    queryKey: ['opportunity-stages'],
    queryFn: () => opportunitiesApi.getStages(),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePipeline(assignedToId?: string) {
  return useQuery({
    queryKey: ['pipeline', assignedToId],
    queryFn: () => opportunitiesApi.getPipeline(assignedToId),
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOpportunityRequest) => opportunitiesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOpportunityRequest }) => opportunitiesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useMoveOpportunityStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => opportunitiesApi.moveToStage(id, stageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}
