import apiClient from './client';
import { ApiResponse } from '@/types/api';
import { MonthlyForecast, RepForecast } from '@/types/dashboard';

export const forecastApi = {
  getMonthlyForecast: async (months: number = 6): Promise<MonthlyForecast[]> => {
    const response = await apiClient.get<ApiResponse<MonthlyForecast[]>>('/forecast/monthly', {
      params: { months },
    });
    return response.data.data!;
  },

  getByRep: async (): Promise<RepForecast[]> => {
    const response = await apiClient.get<ApiResponse<RepForecast[]>>('/forecast/by-rep');
    return response.data.data!;
  },
};

export default forecastApi;
