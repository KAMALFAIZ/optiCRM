import apiClient from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  Invoice,
  InvoiceListItem,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceStats,
  InvoiceStatus,
} from '@/types/invoice';

export interface InvoiceFilters {
  accountId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const invoicesApi = {
  getAll: async (filters: InvoiceFilters = {}) => {
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

    const response = await apiClient.get<ApiResponse<PagedResponse<InvoiceListItem>>>(
      `/invoices?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data;
  },

  getByAccount: async (accountId: string) => {
    const response = await apiClient.get<ApiResponse<InvoiceListItem[]>>(
      `/invoices/account/${accountId}`
    );
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get<ApiResponse<InvoiceStats>>('/invoices/stats');
    return response.data;
  },

  create: async (data: CreateInvoiceRequest) => {
    const response = await apiClient.post<ApiResponse<Invoice>>('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInvoiceRequest) => {
    const response = await apiClient.put<ApiResponse<Invoice>>(`/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/invoices/${id}`);
    return response.data;
  },

  send: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/send`);
    return response.data;
  },

  markPaid: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/mark-paid`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/cancel`);
    return response.data;
  },
};

export default invoicesApi;
