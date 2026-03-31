import apiClient from './client';
import type { ApiResponse, PagedResponse } from '../types/api';
import type {
  Account,
  AccountListItem,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountStats,
  HealthScoreDto,
} from '../types/account';

export interface AccountsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  accountType?: string;
  industryId?: string;
  territoryId?: string;
  hasSageCode?: boolean;
  societeAffectation?: string;
  assignedToId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const accountsApi = {
  getAll: async (params: AccountsQueryParams = {}): Promise<PagedResponse<AccountListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      accountType: params.accountType,
      industryId: params.industryId,
      territoryId: params.territoryId,
      hasSageCode: params.hasSageCode,
      societeAffectation: params.societeAffectation,
      assignedToId: params.assignedToId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };
    const response = await apiClient.get<ApiResponse<AccountListItem[]>>('/accounts', { params: backendParams });
    const meta = response.data.meta;
    const page = meta?.page || 0;
    const size = meta?.perPage || meta?.size || 20;
    const totalElements = meta?.total || meta?.totalElements || 0;
    const totalPages = meta?.totalPages || 0;
    return { content: response.data.data || [], page, size, totalElements, totalPages, meta: { page, size, totalElements, totalPages } };
  },

  getGeolocated: async (): Promise<AccountListItem[]> => {
    const response = await apiClient.get<ApiResponse<AccountListItem[]>>('/accounts/geolocated');
    return response.data.data!;
  },

  getById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<ApiResponse<Account>>(`/accounts/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateAccountRequest): Promise<Account> => {
    const response = await apiClient.post<ApiResponse<Account>>('/accounts', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateAccountRequest): Promise<Account> => {
    const response = await apiClient.put<ApiResponse<Account>>(`/accounts/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },

  getStats: async (id: string): Promise<AccountStats> => {
    const response = await apiClient.get<ApiResponse<AccountStats>>(`/accounts/${id}/stats`);
    return response.data.data!;
  },

  search: async (query: string): Promise<AccountListItem[]> => {
    const response = await apiClient.get<ApiResponse<AccountListItem[]>>('/accounts/search', { params: { q: query } });
    return response.data.data!;
  },

  getHealthScore: async (accountId: string): Promise<HealthScoreDto> => {
    const response = await apiClient.get<ApiResponse<HealthScoreDto>>(`/accounts/${accountId}/health-score`);
    return response.data.data!;
  },
};
