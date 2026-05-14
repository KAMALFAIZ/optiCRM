import apiClient from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  Campaign,
  CampaignListItem,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignStatus,
  CampaignType,
} from '@/types/campaign';

export interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const campaignsApi = {
  getAll: async (filters: CampaignFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<CampaignListItem>>>(
      `/campaigns?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Campaign>>(`/campaigns/${id}`);
    return response.data;
  },

  create: async (data: CreateCampaignRequest) => {
    const response = await apiClient.post<ApiResponse<Campaign>>('/campaigns', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCampaignRequest) => {
    const response = await apiClient.put<ApiResponse<Campaign>>(`/campaigns/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/campaigns/${id}`);
    return response.data;
  },
};

export default campaignsApi;
