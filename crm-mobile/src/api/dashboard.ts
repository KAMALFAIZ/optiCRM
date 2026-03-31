import apiClient from './client';
import type { ApiResponse } from '../types/api';
import type { DashboardStats } from '../types/dashboard';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data!;
  },
};
