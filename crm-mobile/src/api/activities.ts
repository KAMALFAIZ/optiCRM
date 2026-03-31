import apiClient from './client';
import type { ApiResponse, PagedResponse } from '../types/api';
import type {
  Activity,
  ActivityListItem,
  CreateActivityRequest,
  UpdateActivityRequest,
} from '../types/activity';

export interface ActivitiesQueryParams {
  page?: number;
  size?: number;
  search?: string;
  activityType?: string;
  status?: string;
  assignedToId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const activitiesApi = {
  getAll: async (params: ActivitiesQueryParams = {}): Promise<PagedResponse<ActivityListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      activityType: params.activityType,
      status: params.status,
      assignedToId: params.assignedToId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };
    const response = await apiClient.get<ApiResponse<ActivityListItem[]>>('/activities', { params: backendParams });
    const meta = response.data.meta;
    const page = meta?.page || 0;
    const size = meta?.perPage || meta?.size || 20;
    const totalElements = meta?.total || meta?.totalElements || 0;
    const totalPages = meta?.totalPages || 0;
    return { content: response.data.data || [], page, size, totalElements, totalPages, meta: { page, size, totalElements, totalPages } };
  },

  getCalendarEvents: async (from: string, to: string, assignedToId?: string): Promise<ActivityListItem[]> => {
    const response = await apiClient.get<ApiResponse<ActivityListItem[]>>('/activities/calendar', {
      params: { from, to, assignedToId },
    });
    return response.data.data!;
  },

  getById: async (id: string): Promise<Activity> => {
    const response = await apiClient.get<ApiResponse<Activity>>(`/activities/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateActivityRequest): Promise<Activity> => {
    const response = await apiClient.post<ApiResponse<Activity>>('/activities', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateActivityRequest): Promise<Activity> => {
    const response = await apiClient.put<ApiResponse<Activity>>(`/activities/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/activities/${id}`);
  },

  complete: async (id: string): Promise<Activity> => {
    const response = await apiClient.patch<ApiResponse<Activity>>(`/activities/${id}/complete`);
    return response.data.data!;
  },
};
