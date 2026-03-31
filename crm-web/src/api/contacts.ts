import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { Contact, ContactListItem, CreateContactRequest, UpdateContactRequest } from '../types/contact';

export interface ContactsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  accountId?: string;
  status?: string;
  assignedToId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const contactsApi = {
  getAll: async (params: ContactsQueryParams = {}): Promise<PagedResponse<ContactListItem>> => {
    // Map frontend params to backend params
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      accountId: params.accountId,
      status: params.status,
      assignedToId: params.assignedToId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<ContactListItem[]>>('/contacts', { params: backendParams });
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

  getById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get<ApiResponse<Contact>>(`/contacts/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateContactRequest): Promise<Contact> => {
    const response = await apiClient.post<ApiResponse<Contact>>('/contacts', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    const response = await apiClient.put<ApiResponse<Contact>>(`/contacts/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },

  checkDuplicate: async (email: string, phone?: string): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<boolean>>('/contacts/check-duplicate', {
      params: { email, phone }
    });
    return response.data.data!;
  },

  getByAccount: async (accountId: string): Promise<ContactListItem[]> => {
    const response = await apiClient.get<ApiResponse<ContactListItem[]>>(`/contacts/by-account/${accountId}`);
    return response.data.data!;
  },
};

export default contactsApi;
