import apiClient from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  EmailTemplate,
  EmailTemplateListItem,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
} from '@/types/emailTemplate';

export interface EmailTemplateFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const emailTemplatesApi = {
  getAll: async (filters: EmailTemplateFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await apiClient.get<ApiResponse<PagedResponse<EmailTemplateListItem>>>(
      `/email-templates?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<EmailTemplate>>(`/email-templates/${id}`);
    return response.data;
  },

  create: async (data: CreateEmailTemplateRequest) => {
    const response = await apiClient.post<ApiResponse<EmailTemplate>>('/email-templates', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEmailTemplateRequest) => {
    const response = await apiClient.put<ApiResponse<EmailTemplate>>(`/email-templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/email-templates/${id}`);
    return response.data;
  },

  toggleActive: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<EmailTemplate>>(`/email-templates/${id}/toggle-active`);
    return response.data;
  },
};

export default emailTemplatesApi;
