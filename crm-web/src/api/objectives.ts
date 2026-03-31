import apiClient from './client';

export interface ObjectiveDto {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productCode: string;
  productName: string;
  periodYear: number;
  periodMonth: number | null;
  targetQty: number;
  targetAmount: number;
  notes: string | null;
  createdAt: string;
}

export interface SaleEntryDto {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productCode: string;
  productName: string;
  accountId: string | null;
  accountName: string | null;
  saleDate: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
}

export interface ObjectiveTrackingDto {
  userId: string;
  userName: string;
  productId: string;
  productCode: string;
  productName: string;
  periodYear: number;
  periodMonth: number | null;
  targetQty: number;
  targetAmount: number;
  actualQty: number;
  actualAmount: number;
  achievementQtyPct: number;
  achievementAmountPct: number;
  status: 'EXCEEDED' | 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' | 'NO_OBJECTIVE';
}

export interface CreateObjectiveRequest {
  userId: string;
  productId: string;
  periodYear: number;
  periodMonth: number | null;
  targetQty: number;
  targetAmount: number;
  notes?: string;
}

export interface CreateSaleEntryRequest {
  userId: string;
  productId: string;
  accountId?: string;
  saleDate: string;
  qty: number;
  unitPrice: number;
  notes?: string;
}

const objectivesApi = {
  // ── Objectifs ──────────────────────────────────────────────────────────────
  listObjectives: (year: number, month?: number | null, userId?: string) => {
    const params: Record<string, any> = { year };
    if (month) params.month = month;
    if (userId) params.userId = userId;
    return apiClient.get<{ data: ObjectiveDto[] }>('/objectives', { params })
      .then(r => r.data.data);
  },

  upsertObjective: (req: CreateObjectiveRequest) =>
    apiClient.post<{ data: ObjectiveDto }>('/objectives', req).then(r => r.data.data),

  deleteObjective: (id: string) =>
    apiClient.delete(`/objectives/${id}`),

  // ── Ventes ─────────────────────────────────────────────────────────────────
  listSales: (year: number, month?: number | null, userId?: string, productId?: string) => {
    const params: Record<string, any> = { year };
    if (month) params.month = month;
    if (userId) params.userId = userId;
    if (productId) params.productId = productId;
    return apiClient.get<{ data: SaleEntryDto[] }>('/objectives/sales', { params })
      .then(r => r.data.data);
  },

  createSale: (req: CreateSaleEntryRequest) =>
    apiClient.post<{ data: SaleEntryDto }>('/objectives/sales', req).then(r => r.data.data),

  updateSale: (id: string, req: CreateSaleEntryRequest) =>
    apiClient.put<{ data: SaleEntryDto }>(`/objectives/sales/${id}`, req).then(r => r.data.data),

  deleteSale: (id: string) =>
    apiClient.delete(`/objectives/sales/${id}`),

  // ── Tracking ───────────────────────────────────────────────────────────────
  getTracking: (year: number, month?: number | null, userId?: string) => {
    const params: Record<string, any> = { year };
    if (month) params.month = month;
    if (userId) params.userId = userId;
    return apiClient.get<{ data: ObjectiveTrackingDto[] }>('/objectives/tracking', { params })
      .then(r => r.data.data);
  },
};

export default objectivesApi;
