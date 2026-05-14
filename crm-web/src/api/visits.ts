import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { Visit, VisitListItem, CreateVisitRequest, UpdateVisitRequest } from '../types/visit';

export interface VisitsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  visitType?: string;
  assignedToId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const visitsApi = {
  getAll: async (params: VisitsQueryParams = {}): Promise<PagedResponse<VisitListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      status: params.status,
      visitType: params.visitType,
      assignedToId: params.assignedToId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<VisitListItem[]>>('/visits', { params: backendParams });
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

  getCalendarEvents: async (from: string, to: string, assignedToId?: string): Promise<VisitListItem[]> => {
    const params: Record<string, string> = { from, to };
    if (assignedToId) params.assignedToId = assignedToId;
    const response = await apiClient.get<ApiResponse<VisitListItem[]>>('/visits/calendar', { params });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Visit> => {
    const response = await apiClient.get<ApiResponse<Visit>>(`/visits/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateVisitRequest): Promise<Visit> => {
    const response = await apiClient.post<ApiResponse<Visit>>('/visits', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateVisitRequest): Promise<Visit> => {
    const response = await apiClient.put<ApiResponse<Visit>>(`/visits/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/visits/${id}`);
  },

  checkIn: async (id: string, latitude?: number, longitude?: number): Promise<Visit> => {
    const params: Record<string, number> = {};
    if (latitude !== undefined) params.latitude = latitude;
    if (longitude !== undefined) params.longitude = longitude;
    const response = await apiClient.patch<ApiResponse<Visit>>(`/visits/${id}/check-in`, null, { params });
    return response.data.data!;
  },

  checkOut: async (id: string, notes?: string, outcome?: string): Promise<Visit> => {
    const params: Record<string, string> = {};
    if (notes) params.notes = notes;
    if (outcome) params.outcome = outcome;
    const response = await apiClient.patch<ApiResponse<Visit>>(`/visits/${id}/check-out`, null, { params });
    return response.data.data!;
  },
};

export default visitsApi;
