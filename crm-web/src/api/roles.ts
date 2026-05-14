import apiClient from './client';
import { ApiResponse } from '../types/api';
import { RoleItem, CreateRoleRequest, UpdateRoleRequest, RolePermissions } from '../types/role';

export const rolesApi = {
  getAll: async (): Promise<RoleItem[]> => {
    const response = await apiClient.get<ApiResponse<RoleItem[]>>('/roles');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<RoleItem> => {
    const response = await apiClient.get<ApiResponse<RoleItem>>(`/roles/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateRoleRequest): Promise<RoleItem> => {
    const response = await apiClient.post<ApiResponse<RoleItem>>('/roles', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateRoleRequest): Promise<RoleItem> => {
    const response = await apiClient.put<ApiResponse<RoleItem>>(`/roles/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },

  updatePermissions: async (id: string, permissions: RolePermissions): Promise<RoleItem> => {
    const response = await apiClient.patch<ApiResponse<RoleItem>>(`/roles/${id}/permissions`, permissions);
    return response.data.data!;
  },

  duplicate: async (id: string, name: string): Promise<RoleItem> => {
    const response = await apiClient.post<ApiResponse<RoleItem>>(`/roles/${id}/duplicate`, null, {
      params: { name },
    });
    return response.data.data!;
  },
};

export default rolesApi;
