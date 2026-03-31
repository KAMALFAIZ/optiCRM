import apiClient from './client';
import { ApiResponse } from '../types/api';
import { Warehouse, CreateWarehouseRequest } from '../types/warehouse';

export const warehousesApi = {
  getAll: async (): Promise<Warehouse[]> => {
    const response = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses');
    return response.data.data || [];
  },

  getActive: async (): Promise<Warehouse[]> => {
    const response = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses/active');
    return response.data.data || [];
  },

  search: async (query: string): Promise<Warehouse[]> => {
    const response = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses/search', {
      params: { q: query }
    });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Warehouse> => {
    const response = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateWarehouseRequest): Promise<Warehouse> => {
    const response = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', data);
    return response.data.data!;
  },

  update: async (id: string, data: CreateWarehouseRequest): Promise<Warehouse> => {
    const response = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}`);
  },

  setDefault: async (id: string): Promise<Warehouse> => {
    const response = await apiClient.post<ApiResponse<Warehouse>>(`/warehouses/${id}/set-default`);
    return response.data.data!;
  },
};

export default warehousesApi;
