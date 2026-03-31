import apiClient from './client';
import { ApiResponse } from '../types/api';

export interface SearchItem {
  id: string;
  type: 'ACCOUNT' | 'CONTACT' | 'LEAD' | 'OPPORTUNITY' | 'PRODUCT';
  title: string;
  subtitle: string;
  icon: string;
}

export interface GlobalSearchResult {
  query: string;
  totalResults: number;
  items: SearchItem[];
}

export const searchApi = {
  globalSearch: async (q: string, limit = 10): Promise<GlobalSearchResult> => {
    const response = await apiClient.get<ApiResponse<GlobalSearchResult>>('/search', {
      params: { q, limit },
    });
    return response.data.data!;
  },
};

export default searchApi;
