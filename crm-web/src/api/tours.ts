import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { Tour, TourListItem, CreateTourRequest, UpdateTourRequest } from '../types/tour';

export interface ToursQueryParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  assignedToId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const toursApi = {
  getAll: async (params: ToursQueryParams = {}): Promise<PagedResponse<TourListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      status: params.status,
      assignedToId: params.assignedToId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<TourListItem[]>>('/tours', { params: backendParams });
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

  getById: async (id: string): Promise<Tour> => {
    const response = await apiClient.get<ApiResponse<Tour>>(`/tours/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateTourRequest): Promise<Tour> => {
    const response = await apiClient.post<ApiResponse<Tour>>('/tours', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateTourRequest): Promise<Tour> => {
    const response = await apiClient.put<ApiResponse<Tour>>(`/tours/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tours/${id}`);
  },

  start: async (id: string): Promise<Tour> => {
    const response = await apiClient.patch<ApiResponse<Tour>>(`/tours/${id}/start`);
    return response.data.data!;
  },

  complete: async (id: string): Promise<Tour> => {
    const response = await apiClient.patch<ApiResponse<Tour>>(`/tours/${id}/complete`);
    return response.data.data!;
  },

  reorderVisits: async (id: string, visitIds: string[]): Promise<Tour> => {
    const response = await apiClient.put<ApiResponse<Tour>>(`/tours/${id}/visits`, visitIds);
    return response.data.data!;
  },
};

export default toursApi;
