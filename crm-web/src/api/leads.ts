import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { Lead, LeadListItem, CreateLeadRequest, UpdateLeadRequest, ConvertLeadRequest, LeadScoreDto } from '../types/lead';

export interface LeadsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  source?: string;
  assignedToId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const leadsApi = {
  getAll: async (params: LeadsQueryParams = {}): Promise<PagedResponse<LeadListItem>> => {
    // Map frontend params to backend params
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      status: params.status,
      source: params.source,
      assignedToId: params.assignedToId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<LeadListItem[]>>('/leads', { params: backendParams });
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

  getById: async (id: string): Promise<Lead> => {
    const response = await apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateLeadRequest): Promise<Lead> => {
    const response = await apiClient.post<ApiResponse<Lead>>('/leads', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateLeadRequest): Promise<Lead> => {
    const response = await apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },

  convert: async (id: string, data: ConvertLeadRequest): Promise<{ contactId?: string; accountId?: string; opportunityId?: string }> => {
    const response = await apiClient.post<ApiResponse<{ contactId?: string; accountId?: string; opportunityId?: string }>>(`/leads/${id}/convert`, data);
    return response.data.data!;
  },

  findDuplicates: async (firstName: string, lastName: string, email?: string, phone?: string): Promise<Lead[]> => {
    const response = await apiClient.get<ApiResponse<Lead[]>>('/leads/duplicates', {
      params: { firstName, lastName, email, phone }
    });
    return response.data.data!;
  },

  getScore: async (leadId: string): Promise<LeadScoreDto> => {
    const response = await apiClient.get<ApiResponse<LeadScoreDto>>(`/leads/${leadId}/score`);
    return response.data.data!;
  },

  refreshScore: async (leadId: string): Promise<LeadScoreDto> => {
    const response = await apiClient.post<ApiResponse<LeadScoreDto>>(`/leads/${leadId}/score/refresh`);
    return response.data.data!;
  },
};

export default leadsApi;
