import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { StockMovement, CreateStockMovementRequest, MovementType } from '../types/stock';

export interface StockMovementsQueryParams {
  page?: number;
  size?: number;
  productId?: string;
  warehouseId?: string;
  movementType?: MovementType;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const stockMovementsApi = {
  getAll: async (params: StockMovementsQueryParams = {}): Promise<PagedResponse<StockMovement>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      productId: params.productId,
      warehouseId: params.warehouseId,
      movementType: params.movementType,
      startDate: params.startDate,
      endDate: params.endDate,
      sortBy: params.sortBy || 'createdAt',
      sortDirection: params.sortDirection || 'desc',
    };

    const response = await apiClient.get<ApiResponse<StockMovement[]>>('/stock-movements', { params: backendParams });
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

  getById: async (id: string): Promise<StockMovement> => {
    const response = await apiClient.get<ApiResponse<StockMovement>>(`/stock-movements/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateStockMovementRequest): Promise<StockMovement> => {
    const response = await apiClient.post<ApiResponse<StockMovement>>('/stock-movements', data);
    return response.data.data!;
  },

  createAdjustment: async (productId: string, warehouseId: string, newQuantity: number, notes?: string): Promise<StockMovement> => {
    const response = await apiClient.post<ApiResponse<StockMovement>>('/stock-movements/adjustment', null, {
      params: { productId, warehouseId, newQuantity, notes }
    });
    return response.data.data!;
  },

  getByReference: async (referenceType: string, referenceId: string): Promise<StockMovement[]> => {
    const response = await apiClient.get<ApiResponse<StockMovement[]>>('/stock-movements/by-reference', {
      params: { referenceType, referenceId }
    });
    return response.data.data || [];
  },
};

export default stockMovementsApi;
