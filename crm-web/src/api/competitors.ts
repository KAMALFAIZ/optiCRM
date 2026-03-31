import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { Competitor, CreateCompetitorRequest, UpdateCompetitorRequest } from '../types/competitor';

export interface CompetitorsQueryParams {
  page?: number;
  size?: number;
  search?: string;
}

export const competitorsApi = {
  getAll: async (params: CompetitorsQueryParams = {}): Promise<PagedResponse<Competitor>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
    };

    const response = await apiClient.get<ApiResponse<Competitor[]>>('/competitors', { params: backendParams });
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
      meta: { page, size, totalElements, totalPages },
    };
  },

  getActive: async (): Promise<Competitor[]> => {
    const response = await apiClient.get<ApiResponse<Competitor[]>>('/competitors/active');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Competitor> => {
    const response = await apiClient.get<ApiResponse<Competitor>>(`/competitors/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateCompetitorRequest): Promise<Competitor> => {
    const response = await apiClient.post<ApiResponse<Competitor>>('/competitors', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateCompetitorRequest): Promise<Competitor> => {
    const response = await apiClient.put<ApiResponse<Competitor>>(`/competitors/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/competitors/${id}`);
  },
};

export default competitorsApi;
