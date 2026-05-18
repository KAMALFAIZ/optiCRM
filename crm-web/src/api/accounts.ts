import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { Account, AccountListItem, AccountPhoto, CreateAccountRequest, UpdateAccountRequest, Industry, HealthScoreDto } from '../types/account';

export interface AccountsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  accountType?: string;
  industryId?: string;
  assignedToId?: string;
  territoryId?: string;
  hasSageCode?: boolean;
  societeAffectation?: string;
  representant?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const accountsApi = {
  getAll: async (params: AccountsQueryParams = {}): Promise<PagedResponse<AccountListItem>> => {
    // Map frontend params to backend params
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      accountType: params.accountType,
      industryId: params.industryId,
      assignedToId: params.assignedToId,
      territoryId: params.territoryId,
      hasSageCode: params.hasSageCode,
      societeAffectation: params.societeAffectation,
      representant: params.representant,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<AccountListItem[]>>('/accounts', { params: backendParams });
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
      meta: { page, size, totalElements, totalPages }
    };
  },

  getGeolocated: async (): Promise<AccountListItem[]> => {
    const response = await apiClient.get<ApiResponse<AccountListItem[]>>('/accounts/geolocated');
    return response.data.data || [];
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
    const response = await apiClient.get<ApiResponse<AccountListItem[]>>('/accounts/search', {
      params: { q: query }
    });
    return response.data.data!;
  },

  uploadLogo: async (accountId: string, file: File): Promise<Account> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<Account>>(
      `/accounts/${accountId}/logo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!;
  },

  uploadPhoto: async (accountId: string, file: File, caption?: string): Promise<AccountPhoto> => {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    const response = await apiClient.post<ApiResponse<AccountPhoto>>(
      `/accounts/${accountId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!;
  },

  deletePhoto: async (accountId: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/accounts/${accountId}/photos/${photoId}`);
  },

  getRepresentants: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/accounts/representants');
    return response.data.data || [];
  },

  getHealthScore: async (accountId: string): Promise<HealthScoreDto> => {
    const response = await apiClient.get<ApiResponse<HealthScoreDto>>(`/accounts/${accountId}/health-score`);
    return response.data.data!;
  },

  refreshHealthScore: async (accountId: string): Promise<HealthScoreDto> => {
    const response = await apiClient.post<ApiResponse<HealthScoreDto>>(`/accounts/${accountId}/health-score/refresh`);
    return response.data.data!;
  },
};

export interface AccountStats {
  totalContacts: number;
  totalOpportunities: number;
  openOpportunities: number;
  wonOpportunities: number;
  wonAmount: number;
  openPipeline: number;
  totalRevenue: number;
  totalPaid: number;
  totalDue: number;
  caCurrentYear: number;
  caPreviousYear: number;
  overdueInvoices: number;
  overdueAmount: number;
}

export const industriesApi = {
  getAll: async (): Promise<Industry[]> => {
    const response = await apiClient.get<ApiResponse<Industry[]>>('/industries');
    return response.data.data!;
  },
};

export default accountsApi;
