import apiClient from './client';
import { ApiResponse } from '@/types/api';
import { CommercialKpi, SupervisionData, TrendData } from '@/types/dashboard';

export const kpisApi = {
  getCommercialKpis: async (): Promise<CommercialKpi[]> => {
    const response = await apiClient.get<ApiResponse<CommercialKpi[]>>('/kpis/commercial');
    return response.data.data ?? [];
  },

  getSupervision: async (): Promise<SupervisionData> => {
    const response = await apiClient.get<ApiResponse<SupervisionData>>('/kpis/supervision');
    return response.data.data ?? { scores: [], alerts: [], teamAverageScore: 0, teamBenchmark: null, repBenchmarks: [] };
  },

  getTrends: async (): Promise<TrendData> => {
    const response = await apiClient.get<ApiResponse<TrendData>>('/kpis/trends');
    return response.data.data ?? { teamTrend: [], repTrends: [], monthsIncluded: 6 };
  },
};

export default kpisApi;
