import apiClient from './client';
import type {
  Ticket, TicketListItem, TicketStats, TicketComment,
  CreateTicketPayload, UpdateTicketPayload, TicketStatus,
} from '../types/ticket';

export interface TicketFilters {
  status?: string;
  category?: string;
  priority?: string;
  accountId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export const ticketsApi = {
  getAll: async (filters: TicketFilters = {}): Promise<PageResult<TicketListItem>> => {
    const { data } = await apiClient.get('/tickets', { params: filters });
    return data.data;
  },

  getById: async (id: string): Promise<Ticket> => {
    const { data } = await apiClient.get(`/tickets/${id}`);
    return data.data;
  },

  getByAccount: async (accountId: string, page = 0, size = 20): Promise<PageResult<TicketListItem>> => {
    const { data } = await apiClient.get(`/tickets/account/${accountId}`, { params: { page, size } });
    return data.data;
  },

  getStats: async (): Promise<TicketStats> => {
    const { data } = await apiClient.get('/tickets/stats');
    return data.data;
  },

  create: async (payload: CreateTicketPayload): Promise<Ticket> => {
    const { data } = await apiClient.post('/tickets', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateTicketPayload): Promise<Ticket> => {
    const { data } = await apiClient.put(`/tickets/${id}`, payload);
    return data.data;
  },

  changeStatus: async (id: string, status: TicketStatus): Promise<Ticket> => {
    const { data } = await apiClient.patch(`/tickets/${id}/status`, null, { params: { status } });
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tickets/${id}`);
  },

  addComment: async (id: string, content: string, internal = false): Promise<TicketComment> => {
    const { data } = await apiClient.post(`/tickets/${id}/comments`, { content, internal });
    return data.data;
  },

  getComments: async (id: string): Promise<TicketComment[]> => {
    const { data } = await apiClient.get(`/tickets/${id}/comments`);
    return data.data;
  },
};
