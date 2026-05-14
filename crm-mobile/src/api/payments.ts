import apiClient from './client';

export type PaymentStatus = 'PENDING' | 'RECEIVED' | 'DEPOSITED' | 'CONFIRMED' | 'RETURNED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DIRECT_DEBIT' | 'MOBILE_PAYMENT' | 'OTHER';

export interface PaymentListItem {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  accountName?: string;
  accountId?: string;
  reference?: string;
  notes?: string;
}

export interface Payment extends PaymentListItem {
  bankAccount?: string;
  allocatedAmount?: number;
  unallocatedAmount?: number;
  allocations?: any[];
}

export interface CreatePaymentRequest {
  accountId: string;
  paymentDate: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface PaymentsQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'En attente', color: '#FF9800' },
  { value: 'RECEIVED', label: 'Reçu', color: '#2196F3' },
  { value: 'DEPOSITED', label: 'Déposé', color: '#00BCD4' },
  { value: 'CONFIRMED', label: 'Confirmé', color: '#4CAF50' },
  { value: 'RETURNED', label: 'Retourné', color: '#F44336' },
  { value: 'CANCELLED', label: 'Annulé', color: '#9E9E9E' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'CASH', label: 'Espèces', icon: 'cash-outline' },
  { value: 'CHECK', label: 'Chèque', icon: 'checkbook' },
  { value: 'BANK_TRANSFER', label: 'Virement', icon: 'bank-transfer' },
  { value: 'CREDIT_CARD', label: 'Carte', icon: 'credit-card' },
  { value: 'DIRECT_DEBIT', label: 'Prélèvement', icon: 'bank' },
  { value: 'MOBILE_PAYMENT', label: 'Mobile', icon: 'cellphone' },
  { value: 'OTHER', label: 'Autre', icon: 'dots-horizontal' },
];

export const paymentsApi = {
  getAll: async (params: PaymentsQueryParams = {}) => {
    const response = await apiClient.get('/payments', {
      params: { page: params.page || 1, perPage: params.perPage || 20, ...params },
    });
    return { content: response.data.data || [], meta: response.data.meta };
  },
  getById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data.data;
  },
  create: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.post('/payments', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<CreatePaymentRequest>): Promise<Payment> => {
    const response = await apiClient.put(`/payments/${id}`, data);
    return response.data.data;
  },
};

export default paymentsApi;
