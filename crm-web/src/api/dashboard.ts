import apiClient from './client';
import { ApiResponse } from '@/types/api';
import { DashboardStats } from '@/types/dashboard';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data!;
  },
};

export default dashboardApi;
