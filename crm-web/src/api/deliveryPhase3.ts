import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface PreOrderItem {
  id?: string;
  itemId?: string;
  quantityOrdered?: number;
  quantityConfirmed?: number;
  unitPrice?: number;
}

export interface PreOrder {
  id?: string;
  deliveryTourId: string;
  customerId?: string;
  status?: string;       // PENDING | CONFIRMED | DELIVERED | CANCELLED
  notes?: string;
  createdAt?: string;
  items?: PreOrderItem[];
}

export interface ProductBatch {
  id?: string;
  itemId?: string;
  batchNumber?: string;
  expiryDate?: string;   // "YYYY-MM-DD"
  quantity?: number;
  warehouseId?: string;
  status?: string;       // ACTIVE | CONSUMED | EXPIRED | RECALLED
  notes?: string;
  createdAt?: string;
  daysUntilExpiry?: number;
  expiryAlert?: string;  // "OK" | "WARNING" | "CRITICAL" | "EXPIRED"
}

export interface RepObjective {
  id?: string;
  representativeId?: string;
  year?: number;
  month?: number;
  revenueTarget?: number;
  visitTarget?: number;
  deliveryTarget?: number;
  notes?: string;
  // réalisé
  revenueActual?: number;
  visitActual?: number;
  deliveryActual?: number;
  revenueRate?: number;
  visitRate?: number;
  deliveryRate?: number;
}

// ═══════════════════════════════════════════════════════════════
// Pre-Order API
// ═══════════════════════════════════════════════════════════════

export const preOrderApi = {
  getByTour: async (tourId: string): Promise<PreOrder[]> => {
    const res = await apiClient.get<PreOrder[]>(`/delivery/pre-order/tour/${tourId}`);
    return res.data || [];
  },
  create: async (data: PreOrder): Promise<PreOrder> => {
    const res = await apiClient.post<PreOrder>('/delivery/pre-order', data);
    return res.data;
  },
  confirm: async (id: string): Promise<PreOrder> => {
    const res = await apiClient.post<PreOrder>(`/delivery/pre-order/${id}/confirm`);
    return res.data;
  },
  cancel: async (id: string): Promise<PreOrder> => {
    const res = await apiClient.post<PreOrder>(`/delivery/pre-order/${id}/cancel`);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/delivery/pre-order/${id}`);
  },
};

// ═══════════════════════════════════════════════════════════════
// Product Batch API
// ═══════════════════════════════════════════════════════════════

export const productBatchApi = {
  getAll: async (): Promise<ProductBatch[]> => {
    const res = await apiClient.get<ProductBatch[]>('/delivery/batch');
    return res.data || [];
  },
  getByItem: async (itemId: string): Promise<ProductBatch[]> => {
    const res = await apiClient.get<ProductBatch[]>(`/delivery/batch/item/${itemId}`);
    return res.data || [];
  },
  getExpiringSoon: async (days = 30): Promise<ProductBatch[]> => {
    const res = await apiClient.get<ProductBatch[]>('/delivery/batch/expiring-soon', { params: { days } });
    return res.data || [];
  },
  create: async (data: ProductBatch): Promise<ProductBatch> => {
    const res = await apiClient.post<ProductBatch>('/delivery/batch', data);
    return res.data;
  },
  update: async (id: string, data: ProductBatch): Promise<ProductBatch> => {
    const res = await apiClient.put<ProductBatch>(`/delivery/batch/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/delivery/batch/${id}`);
  },
  markExpired: async (): Promise<{ markedExpired: number }> => {
    const res = await apiClient.post<{ markedExpired: number }>('/delivery/batch/mark-expired');
    return res.data;
  },
};

// ═══════════════════════════════════════════════════════════════
// Rep Objective API
// ═══════════════════════════════════════════════════════════════

export const repObjectiveApi = {
  getByYearMonth: async (year: number, month: number): Promise<RepObjective[]> => {
    const res = await apiClient.get<RepObjective[]>('/delivery/objective', { params: { year, month } });
    return res.data || [];
  },
  getByRep: async (repId: string): Promise<RepObjective[]> => {
    const res = await apiClient.get<RepObjective[]>(`/delivery/objective/rep/${repId}`);
    return res.data || [];
  },
  upsert: async (data: RepObjective): Promise<RepObjective> => {
    const res = await apiClient.post<RepObjective>('/delivery/objective', data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/delivery/objective/${id}`);
  },
};
