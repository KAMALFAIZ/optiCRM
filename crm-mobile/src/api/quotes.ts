import apiClient from './client';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface QuoteListItem {
  id: string;
  quoteNumber: string;
  name: string;
  status: QuoteStatus;
  accountName?: string;
  accountId?: string;
  contactName?: string;
  quoteDate: string;
  validUntil?: string;
  total: number;
  currency: string;
  assignedToName?: string;
  assignedToId?: string;
}

export interface Quote extends QuoteListItem {
  subtotal: number;
  discount?: number;
  tax?: number;
  notes?: string;
  terms?: string;
  lineItems?: QuoteLineItem[];
}

export interface QuoteLineItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface CreateQuoteRequest {
  name: string;
  accountId?: string;
  contactId?: string;
  quoteDate: string;
  validUntil?: string;
  notes?: string;
  assignedToId?: string;
  lineItems?: { name: string; quantity: number; unitPrice: number }[];
}

export interface QuotesQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: QuoteStatus;
  assignedToId?: string;
}

export const QUOTE_STATUSES: { value: QuoteStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: 'Brouillon', color: '#9E9E9E' },
  { value: 'SENT', label: 'Envoyé', color: '#2196F3' },
  { value: 'VIEWED', label: 'Vu', color: '#00BCD4' },
  { value: 'ACCEPTED', label: 'Accepté', color: '#4CAF50' },
  { value: 'REJECTED', label: 'Refusé', color: '#F44336' },
  { value: 'EXPIRED', label: 'Expiré', color: '#FF9800' },
  { value: 'CANCELLED', label: 'Annulé', color: '#795548' },
];

export const quotesApi = {
  getAll: async (params: QuotesQueryParams = {}) => {
    const response = await apiClient.get('/quotes', {
      params: { page: params.page || 1, perPage: params.perPage || 20, ...params },
    });
    return { content: response.data.data || [], meta: response.data.meta };
  },
  getById: async (id: string): Promise<Quote> => {
    const response = await apiClient.get(`/quotes/${id}`);
    return response.data.data;
  },
  create: async (data: CreateQuoteRequest): Promise<Quote> => {
    const response = await apiClient.post('/quotes', data);
    return response.data.data;
  },
  updateStatus: async (id: string, status: QuoteStatus): Promise<Quote> => {
    const response = await apiClient.patch(`/quotes/${id}/status`, null, { params: { status } });
    return response.data.data;
  },
  duplicate: async (id: string): Promise<Quote> => {
    const response = await apiClient.post(`/quotes/${id}/duplicate`);
    return response.data.data;
  },
};

export default quotesApi;
