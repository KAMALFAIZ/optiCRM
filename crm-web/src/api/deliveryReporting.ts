import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface DayRevenue {
  date: string;
  revenue: number;
  collected: number;
}

export interface RepRevenue {
  representativeId: string;
  revenue: number;
  collected: number;
  tourCount: number;
}

export interface ItemRevenue {
  itemId: string;
  quantity: number;
  revenue: number;
}

export interface DashboardKpi {
  toursDraft: number;
  toursActive: number;
  toursClosed: number;
  toursToday: number;
  revenueToday: number;
  revenueMonth: number;
  collectedToday: number;
  collectedMonth: number;
  totalOutstandingCredit: number;
  collectionRateToday: number;
  collectionRateMonth: number;
  dailyRevenue: DayRevenue[];
  topReps: RepRevenue[];
  topItems: ItemRevenue[];
  visitResultBreakdown: Record<string, number>;
}

export interface TourReport {
  tourId: string;
  tourDate: string;
  zone?: string;
  representativeId?: string;
  tourStatus: string;
  lineCount: number;
  deliveredCount: number;
  absentCount: number;
  refusedCount: number;
  totalAmount: number;
  cashAmount: number;
  creditAmount: number;
  collectedAmount: number;
  outstandingCredit: number;
  collectionRate: number;
}

export interface CreditLine {
  lineId: string;
  customerId?: string;
  tourId: string;
  tourDate: string;
  agingDays: number;
  agingBucket: string;    // "0-30" | "31-60" | "61-90" | "+90"
  invoicedAmount: number;
  paidAmount: number;
  outstanding: number;
  tourStatus: string;
}

export interface CreditAging {
  totalOutstanding: number;
  bucket0_30: number;
  bucket31_60: number;
  bucket61_90: number;
  bucketOver90: number;
  lines: CreditLine[];
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════

export const deliveryDashboardApi = {
  getKpis: async (): Promise<DashboardKpi> => {
    const res = await apiClient.get<DashboardKpi>('/delivery/dashboard/kpis');
    return res.data;
  },
};

export const deliveryReportApi = {
  getTourReports: async (from: string, to: string, representativeId?: string): Promise<TourReport[]> => {
    const res = await apiClient.get<TourReport[]>('/delivery/report/tours', {
      params: { from, to, representativeId },
    });
    return res.data || [];
  },
};

export const creditAgingApi = {
  getAging: async (customerId?: string): Promise<CreditAging> => {
    const res = await apiClient.get<CreditAging>('/delivery/credit-aging', {
      params: { customerId },
    });
    return res.data;
  },
};
