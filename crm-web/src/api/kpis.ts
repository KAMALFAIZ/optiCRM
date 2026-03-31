import apiClient from './client';
import { ApiResponse } from '@/types/api';
import { CommercialKpi } from '@/types/dashboard';

export const kpisApi = {
  getCommercialKpis: async (): Promise<CommercialKpi[]> => {
    const response = await apiClient.get<ApiResponse<CommercialKpi[]>>('/kpis/commercial');
    return response.data.data!;
  },
};

export default kpisApi;
