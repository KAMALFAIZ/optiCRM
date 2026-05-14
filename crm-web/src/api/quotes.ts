import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import {
  Quote,
  QuoteListItem,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  QuoteStatus,
} from '../types/quote';

export interface QuotesQueryParams {
  page?: number;
  size?: number;
  search?: string;
  status?: QuoteStatus;
  accountId?: string;
  assignedToId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const quotesApi = {
  getAll: async (params: QuotesQueryParams = {}): Promise<PagedResponse<QuoteListItem>> => {
    // Map frontend params to backend params
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      status: params.status,
      accountId: params.accountId,
      assignedToId: params.assignedToId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<QuoteListItem[]>>('/quotes', { params: backendParams });
    const meta = response.data.meta;

    const page = meta?.page || 1;
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

  getById: async (id: string): Promise<Quote> => {
    const response = await apiClient.get<ApiResponse<Quote>>(`/quotes/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateQuoteRequest): Promise<Quote> => {
    const response = await apiClient.post<ApiResponse<Quote>>('/quotes', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateQuoteRequest): Promise<Quote> => {
    const response = await apiClient.put<ApiResponse<Quote>>(`/quotes/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/quotes/${id}`);
  },

  getByAccount: async (accountId: string): Promise<QuoteListItem[]> => {
    const response = await apiClient.get<ApiResponse<QuoteListItem[]>>(`/quotes/by-account/${accountId}`);
    return response.data.data!;
  },

  getByOpportunity: async (opportunityId: string): Promise<QuoteListItem[]> => {
    const response = await apiClient.get<ApiResponse<QuoteListItem[]>>(`/quotes/by-opportunity/${opportunityId}`);
    return response.data.data!;
  },

  getByChantier: async (chantierId: string): Promise<QuoteListItem[]> => {
    const response = await apiClient.get<ApiResponse<QuoteListItem[]>>(`/quotes/by-chantier/${chantierId}`);
    return response.data.data!;
  },

  updateStatus: async (id: string, status: QuoteStatus): Promise<Quote> => {
    const response = await apiClient.patch<ApiResponse<Quote>>(`/quotes/${id}/status`, null, {
      params: { status }
    });
    return response.data.data!;
  },

  duplicate: async (id: string): Promise<Quote> => {
    const response = await apiClient.post<ApiResponse<Quote>>(`/quotes/${id}/duplicate`);
    return response.data.data!;
  },
};

export default quotesApi;
