import apiClient from './client';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  currency: string;
  status: InvoiceStatus;
  accountName?: string;
  accountId?: string;
}

export interface Invoice extends InvoiceListItem {
  subtotal?: number;
  discount?: number;
  tax?: number;
  notes?: string;
  terms?: string;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: 'Brouillon', color: '#9E9E9E' },
  { value: 'SENT', label: 'Envoyée', color: '#2196F3' },
  { value: 'PAID', label: 'Payée', color: '#4CAF50' },
  { value: 'PARTIALLY_PAID', label: 'Part. payée', color: '#00BCD4' },
  { value: 'OVERDUE', label: 'En retard', color: '#F44336' },
  { value: 'CANCELLED', label: 'Annulée', color: '#9E9E9E' },
];

export interface InvoicesQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: InvoiceStatus;
}

export const invoicesApi = {
  getAll: async (params: InvoicesQueryParams = {}) => {
    const response = await apiClient.get('/invoices', {
      params: { page: params.page || 1, perPage: params.perPage || 20, ...params },
    });
    return { content: response.data.data || [], meta: response.data.meta };
  },
  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data.data;
  },
};

export default invoicesApi;
