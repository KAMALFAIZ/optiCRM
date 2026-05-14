import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { StockLevel } from '../types/stock';

export interface StockLevelsQueryParams {
  page?: number;
  size?: number;
  warehouseId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const stockLevelsApi = {
  getAll: async (params: StockLevelsQueryParams = {}): Promise<PagedResponse<StockLevel>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      warehouseId: params.warehouseId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<StockLevel[]>>('/stock-levels', { params: backendParams });
    const meta = response.data.meta;

    const page = meta?.page || 1;
    const size = meta?.perPage || meta?.size || 20;
    const totalElements = meta?.total || meta?.totalElements || 0;
    const totalPages = meta?.totalPages || 0;

    return {
      content: response.data.data || [],
      page,
      size,
      totalElements,
      totalPages,
      meta: { page, size, totalElements, totalPages }
    };
  },

  getById: async (id: string): Promise<StockLevel> => {
    const response = await apiClient.get<ApiResponse<StockLevel>>(`/stock-levels/${id}`);
    return response.data.data!;
  },

  getByProduct: async (productId: string): Promise<StockLevel[]> => {
    const response = await apiClient.get<ApiResponse<StockLevel[]>>(`/stock-levels/product/${productId}`);
    return response.data.data || [];
  },

  getByProductAndWarehouse: async (productId: string, warehouseId: string): Promise<StockLevel> => {
    const response = await apiClient.get<ApiResponse<StockLevel>>(`/stock-levels/product/${productId}/warehouse/${warehouseId}`);
    return response.data.data!;
  },

  getLowStock: async (): Promise<StockLevel[]> => {
    const response = await apiClient.get<ApiResponse<StockLevel[]>>('/stock-levels/low-stock');
    return response.data.data || [];
  },

  getNeedsReorder: async (): Promise<StockLevel[]> => {
    const response = await apiClient.get<ApiResponse<StockLevel[]>>('/stock-levels/needs-reorder');
    return response.data.data || [];
  },

  getTotalAvailable: async (productId: string): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(`/stock-levels/product/${productId}/total`);
    return response.data.data || 0;
  },

  checkAvailability: async (productId: string, warehouseId: string, quantity: number): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<boolean>>('/stock-levels/check-availability', {
      params: { productId, warehouseId, quantity }
    });
    return response.data.data || false;
  },
};

export default stockLevelsApi;
