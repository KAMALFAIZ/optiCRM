import apiClient from './client';
import { ApiResponse } from '../types/api';
import {
  ExpenseReport,
  ExpenseReportListItem,
  CreateExpenseReportRequest,
  UpdateExpenseReportRequest,
} from '../types/expenseReport';

export interface ExpenseReportQueryParams {
  tourId?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

interface PagedBackendResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const expenseReportsApi = {
  getAll: async (params: ExpenseReportQueryParams = {}) => {
    const response = await apiClient.get<ApiResponse<PagedBackendResponse<ExpenseReportListItem>>>('/expense-reports', {
      params: {
        tourId: params.tourId,
        status: params.status,
        search: params.search,
        page: (params.page || 1) - 1,
        size: params.size || 20,
        sortBy: params.sortBy || 'createdAt',
        sortDir: params.sortDir || 'desc',
      },
    });
    const data = response.data.data!;
    return {
      content: data.content,
      page: data.page + 1,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
    };
  },

  getById: async (id: string): Promise<ExpenseReport> => {
    const response = await apiClient.get<ApiResponse<ExpenseReport>>(`/expense-reports/${id}`);
    return response.data.data!;
  },

  getByTour: async (tourId: string): Promise<ExpenseReportListItem[]> => {
    const response = await apiClient.get<ApiResponse<ExpenseReportListItem[]>>(`/expense-reports/tour/${tourId}`);
    return response.data.data || [];
  },

  create: async (data: CreateExpenseReportRequest): Promise<ExpenseReport> => {
    const response = await apiClient.post<ApiResponse<ExpenseReport>>('/expense-reports', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateExpenseReportRequest): Promise<ExpenseReport> => {
    const response = await apiClient.put<ApiResponse<ExpenseReport>>(`/expense-reports/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expense-reports/${id}`);
  },

  submit: async (id: string): Promise<ExpenseReport> => {
    const response = await apiClient.patch<ApiResponse<ExpenseReport>>(`/expense-reports/${id}/submit`);
    return response.data.data!;
  },

  approve: async (id: string): Promise<ExpenseReport> => {
    const response = await apiClient.patch<ApiResponse<ExpenseReport>>(`/expense-reports/${id}/approve`);
    return response.data.data!;
  },

  reject: async (id: string, reason: string): Promise<ExpenseReport> => {
    const response = await apiClient.patch<ApiResponse<ExpenseReport>>(`/expense-reports/${id}/reject`, { reason });
    return response.data.data!;
  },

  reimburse: async (id: string): Promise<ExpenseReport> => {
    const response = await apiClient.patch<ApiResponse<ExpenseReport>>(`/expense-reports/${id}/reimburse`);
    return response.data.data!;
  },

  uploadReceipt: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<string>>('/expense-reports/upload-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },
};

export default expenseReportsApi;
