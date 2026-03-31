import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';
import { Product, ProductListItem, CreateProductRequest, UpdateProductRequest } from '../types/product';
import { StockLevel } from '../types/stock';

export interface ProductsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isStockable?: boolean;
  isSellable?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const productsApi = {
  getAll: async (params: ProductsQueryParams = {}): Promise<PagedResponse<ProductListItem>> => {
    const backendParams = {
      page: params.page || 1,
      perPage: params.size || 20,
      search: params.search,
      categoryId: params.categoryId,
      isActive: params.isActive,
      isStockable: params.isStockable,
      isSellable: params.isSellable,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    };

    const response = await apiClient.get<ApiResponse<ProductListItem[]>>('/products', { params: backendParams });
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

  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateProductRequest): Promise<Product> => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  uploadDatasheet: async (id: string, file: File): Promise<Product> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<Product>>(`/products/${id}/datasheet`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },

  deleteDatasheet: async (id: string): Promise<Product> => {
    const response = await apiClient.delete<ApiResponse<Product>>(`/products/${id}/datasheet`);
    return response.data.data!;
  },

  getStock: async (id: string): Promise<StockLevel[]> => {
    const response = await apiClient.get<ApiResponse<StockLevel[]>>(`/products/${id}/stock`);
    return response.data.data || [];
  },

  getStatsByCategory: async (): Promise<Record<string, number>> => {
    const response = await apiClient.get<ApiResponse<Record<string, number>>>('/products/stats/by-category');
    return response.data.data || {};
  },

  getCounts: async (): Promise<{ active: number; stockable: number }> => {
    const response = await apiClient.get<ApiResponse<{ active: number; stockable: number }>>('/products/stats/counts');
    return response.data.data || { active: 0, stockable: 0 };
  },
};

export default productsApi;
