import apiClient from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  SalesOrder,
  SalesOrderListItem,
  CreateSalesOrderRequest,
  UpdateSalesOrderRequest,
  OrderStatus,
} from '@/types/salesOrder';

export interface SalesOrderFilters {
  accountId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const salesOrdersApi = {
  getAll: async (filters: SalesOrderFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.accountId) params.append('accountId', filters.accountId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<SalesOrderListItem>>>(
      `/orders?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<SalesOrder>>(`/orders/${id}`);
    return response.data;
  },

  getByAccount: async (accountId: string) => {
    const response = await apiClient.get<ApiResponse<SalesOrderListItem[]>>(
      `/orders/account/${accountId}`
    );
    return response.data;
  },

  create: async (data: CreateSalesOrderRequest) => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>('/orders', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSalesOrderRequest) => {
    const response = await apiClient.put<ApiResponse<SalesOrder>>(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/orders/${id}`);
    return response.data;
  },

  confirm: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<SalesOrder>>(`/orders/${id}/confirm`);
    return response.data;
  },

  ship: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<SalesOrder>>(`/orders/${id}/ship`);
    return response.data;
  },

  deliver: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<SalesOrder>>(`/orders/${id}/deliver`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<SalesOrder>>(`/orders/${id}/cancel`);
    return response.data;
  },
};

export default salesOrdersApi;
