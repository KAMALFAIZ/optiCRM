import apiClient from './client';
import { ApiResponse } from '../types/api';
import {
  UserListItem,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  RoleOption,
  TeamOption,
  TerritoryOption,
  UserStats,
  UserActivity,
} from '../types/user';
import { PagedResponse } from '../types/api';

export interface UsersQueryParams {
  page?: number;
  size?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const usersApi = {
  getAll: async (params: UsersQueryParams = {}): Promise<PagedResponse<UserListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search || undefined,
      roleId: params.roleId || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<UserListItem[]>>('/users', { params: backendParams });
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

  getById: async (id: string): Promise<UserListItem> => {
    const response = await apiClient.get<ApiResponse<UserListItem>>(`/users/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateUserRequest): Promise<UserListItem> => {
    const response = await apiClient.post<ApiResponse<UserListItem>>('/users', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<UserListItem> => {
    const response = await apiClient.put<ApiResponse<UserListItem>>(`/users/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.post(`/users/${id}/delete`);
  },

  activate: async (id: string): Promise<void> => {
    await apiClient.patch(`/users/${id}/activate`);
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.patch(`/users/${id}/deactivate`);
  },

  changePassword: async (id: string, data: ChangePasswordRequest): Promise<void> => {
    await apiClient.patch(`/users/${id}/change-password`, data);
  },

  unlock: async (id: string): Promise<void> => {
    await apiClient.patch(`/users/${id}/unlock`);
  },

  getRoles: async (): Promise<RoleOption[]> => {
    const response = await apiClient.get<ApiResponse<RoleOption[]>>('/users/roles');
    return response.data.data || [];
  },

  getTeams: async (): Promise<TeamOption[]> => {
    const response = await apiClient.get<ApiResponse<TeamOption[]>>('/users/teams');
    return response.data.data || [];
  },

  getTerritories: async (): Promise<TerritoryOption[]> => {
    const response = await apiClient.get<ApiResponse<TerritoryOption[]>>('/users/territories');
    return response.data.data || [];
  },

  // ---- Statistics ----
  getStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<ApiResponse<UserStats>>('/users/stats');
    return response.data.data!;
  },

  // ---- Export Excel ----
  exportExcel: async (params: Partial<UsersQueryParams> = {}): Promise<void> => {
    const response = await apiClient.get('/users/export', {
      params: {
        search: params.search || undefined,
        roleId: params.roleId || undefined,
        isActive: params.isActive,
      },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'utilisateurs.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // ---- Batch operations ----
  batchActivate: async (ids: string[]): Promise<{ affected: number }> => {
    const response = await apiClient.patch<ApiResponse<{ affected: number }>>('/users/batch/activate', { ids });
    return response.data.data!;
  },

  batchDeactivate: async (ids: string[]): Promise<{ affected: number }> => {
    const response = await apiClient.patch<ApiResponse<{ affected: number }>>('/users/batch/deactivate', { ids });
    return response.data.data!;
  },

  // ---- Activity history ----
  getActivities: async (userId: string, page = 1, perPage = 20): Promise<{ content: UserActivity[]; totalElements: number }> => {
    const response = await apiClient.get<ApiResponse<UserActivity[]>>(`/users/${userId}/activities`, {
      params: { page, perPage },
    });
    const meta = response.data.meta;
    return {
      content: response.data.data || [],
      totalElements: meta?.total || meta?.totalElements || 0,
    };
  },

  // ---- Avatar upload ----
  uploadAvatar: async (userId: string, file: File): Promise<UserListItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<UserListItem>>(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },
};

export default usersApi;
