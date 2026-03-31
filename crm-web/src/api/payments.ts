import apiClient from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  Payment,
  PaymentListItem,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentStats,
  PaymentAllocation,
  CreateAllocationRequest,
  PaymentMethod,
  PaymentStatus,
} from '@/types/payment';

export interface PaymentFilters {
  accountId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const paymentsApi = {
  getAll: async (filters: PaymentFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.accountId) params.append('accountId', filters.accountId);
    if (filters.status) params.append('status', filters.status);
    if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<PaymentListItem>>>(
      `/payments?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
    return response.data;
  },

  getByAccount: async (accountId: string) => {
    const response = await apiClient.get<ApiResponse<PaymentListItem[]>>(
      `/payments/account/${accountId}`
    );
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get<ApiResponse<PaymentStats>>('/payments/stats');
    return response.data;
  },

  create: async (data: CreatePaymentRequest) => {
    const response = await apiClient.post<ApiResponse<Payment>>('/payments', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePaymentRequest) => {
    const response = await apiClient.put<ApiResponse<Payment>>(`/payments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/payments/${id}`);
    return response.data;
  },

  allocate: async (paymentId: string, data: CreateAllocationRequest) => {
    const response = await apiClient.post<ApiResponse<PaymentAllocation>>(
      `/payments/${paymentId}/allocations`,
      data
    );
    return response.data;
  },

  removeAllocation: async (paymentId: string, allocationId: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/payments/${paymentId}/allocations/${allocationId}`
    );
    return response.data;
  },
};

export default paymentsApi;
