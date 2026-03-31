import apiClient from './client';
import type { ApiResponse, PagedResponse } from '../types/api';
import type {
  Opportunity,
  OpportunityListItem,
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
  OpportunityStage,
  PipelineSummary,
} from '../types/opportunity';

export interface OpportunitiesQueryParams {
  page?: number;
  size?: number;
  search?: string;
  stageId?: string;
  accountId?: string;
  isClosed?: boolean;
  assignedToId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const opportunitiesApi = {
  getAll: async (params: OpportunitiesQueryParams = {}): Promise<PagedResponse<OpportunityListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      stageId: params.stageId,
      accountId: params.accountId,
      isClosed: params.isClosed,
      assignedToId: params.assignedToId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };
    const response = await apiClient.get<ApiResponse<OpportunityListItem[]>>('/opportunities', { params: backendParams });
    const meta = response.data.meta;
    const page = meta?.page || 0;
    const size = meta?.perPage || meta?.size || 20;
    const totalElements = meta?.total || meta?.totalElements || 0;
    const totalPages = meta?.totalPages || 0;
    return { content: response.data.data || [], page, size, totalElements, totalPages, meta: { page, size, totalElements, totalPages } };
  },

  getById: async (id: string): Promise<Opportunity> => {
    const response = await apiClient.get<ApiResponse<Opportunity>>(`/opportunities/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateOpportunityRequest): Promise<Opportunity> => {
    const response = await apiClient.post<ApiResponse<Opportunity>>('/opportunities', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateOpportunityRequest): Promise<Opportunity> => {
    const response = await apiClient.put<ApiResponse<Opportunity>>(`/opportunities/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/opportunities/${id}`);
  },

  getStages: async (): Promise<OpportunityStage[]> => {
    const response = await apiClient.get<ApiResponse<OpportunityStage[]>>('/opportunities/stages');
    return response.data.data!;
  },

  getPipeline: async (assignedToId?: string): Promise<PipelineSummary> => {
    const response = await apiClient.get<ApiResponse<PipelineSummary>>('/opportunities/pipeline', {
      params: assignedToId ? { assignedToId } : undefined,
    });
    return response.data.data!;
  },

  moveToStage: async (id: string, stageId: string): Promise<Opportunity> => {
    const response = await apiClient.patch<ApiResponse<Opportunity>>(`/opportunities/${id}/stage`, { stageId });
    return response.data.data!;
  },
};
