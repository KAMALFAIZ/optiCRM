import apiClient from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  Objection,
  ObjectionListItem,
  CreateObjectionRequest,
  UpdateObjectionRequest,
  ResolveObjectionRequest,
  ObjectionStats,
  ObjectionCategory,
  ObjectionStatus,
  ObjectionPriority,
} from '@/types/objection';

export interface ObjectionFilters {
  status?: ObjectionStatus;
  category?: ObjectionCategory;
  priority?: ObjectionPriority;
  assignedToId?: string;
  accountId?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const objectionsApi = {
  getAll: async (filters: ObjectionFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters.accountId) params.append('accountId', filters.accountId);
    if (filters.search) params.append('search', filters.search);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<ObjectionListItem>>>(
      `/objections?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Objection>>(`/objections/${id}`);
    return response.data;
  },

  getByAccount: async (accountId: string, page = 0, size = 20) => {
    const response = await apiClient.get<ApiResponse<PagedResponse<ObjectionListItem>>>(
      `/objections/account/${accountId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  getByContact: async (contactId: string, page = 0, size = 20) => {
    const response = await apiClient.get<ApiResponse<PagedResponse<ObjectionListItem>>>(
      `/objections/contact/${contactId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  getByOpportunity: async (opportunityId: string, page = 0, size = 20) => {
    const response = await apiClient.get<ApiResponse<PagedResponse<ObjectionListItem>>>(
      `/objections/opportunity/${opportunityId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get<ApiResponse<ObjectionStats>>('/objections/stats');
    return response.data;
  },

  create: async (data: CreateObjectionRequest) => {
    const response = await apiClient.post<ApiResponse<Objection>>('/objections', data);
    return response.data;
  },

  update: async (id: string, data: UpdateObjectionRequest) => {
    const response = await apiClient.put<ApiResponse<Objection>>(`/objections/${id}`, data);
    return response.data;
  },

  resolve: async (id: string, data: ResolveObjectionRequest) => {
    const response = await apiClient.post<ApiResponse<Objection>>(`/objections/${id}/resolve`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/objections/${id}`);
    return response.data;
  },
};

export default objectionsApi;
