import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import {
  Opportunity,
  OpportunityListItem,
  OpportunityStage,
  PipelineSummary,
  CreateOpportunityRequest,
  UpdateOpportunityRequest
} from '../types/opportunity';

export interface OpportunitiesQueryParams {
  page?: number;
  size?: number;
  search?: string;
  stageId?: string;
  accountId?: string;
  assignedToId?: string;
  isClosed?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const opportunitiesApi = {
  getAll: async (params: OpportunitiesQueryParams = {}): Promise<PagedResponse<OpportunityListItem>> => {
    // Map frontend params to backend params
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      stageId: params.stageId,
      accountId: params.accountId,
      assignedToId: params.assignedToId,
      isClosed: params.isClosed,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<OpportunityListItem[]>>('/opportunities', { params: backendParams });
    const meta = response.data.meta;

    const page = meta?.page || 0;
    const size = meta?.perPage || meta?.size || 20;
    const totalElements = meta?.total || meta?.totalElements || 0;
    const totalPages = meta?.totalPages || 0;

    return {
      content: response.data.data || [],
      page,
      size,
      totalElements,
      totalPages,
      meta: { page, size, totalElements, totalPages }
    };
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

  getByAccount: async (accountId: string): Promise<OpportunityListItem[]> => {
    const response = await apiClient.get<ApiResponse<OpportunityListItem[]>>(`/opportunities/by-account/${accountId}`);
    return response.data.data!;
  },

  getPipeline: async (assignedToId?: string): Promise<PipelineSummary> => {
    const params = assignedToId ? { assignedToId } : {};
    const response = await apiClient.get<ApiResponse<PipelineSummary>>('/opportunities/pipeline', { params });
    return response.data.data!;
  },

  moveToStage: async (id: string, stageId: string): Promise<OpportunityListItem> => {
    const response = await apiClient.patch<ApiResponse<OpportunityListItem>>(`/opportunities/${id}/stage`, { stageId });
    return response.data.data!;
  },
};

export default opportunitiesApi;
