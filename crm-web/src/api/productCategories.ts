import apiClient from './client';
import { ApiResponse } from '../types/api';
import { ProductCategory, ProductCategoryListItem, CreateProductCategoryRequest } from '../types/product';

export const productCategoriesApi = {
  getAll: async (): Promise<ProductCategoryListItem[]> => {
    const response = await apiClient.get<ApiResponse<ProductCategoryListItem[]>>('/product-categories');
    return response.data.data || [];
  },

  getTree: async (): Promise<ProductCategory[]> => {
    const response = await apiClient.get<ApiResponse<ProductCategory[]>>('/product-categories/tree');
    return response.data.data || [];
  },

  search: async (query: string): Promise<ProductCategoryListItem[]> => {
    const response = await apiClient.get<ApiResponse<ProductCategoryListItem[]>>('/product-categories/search', {
      params: { q: query }
    });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<ProductCategory> => {
    const response = await apiClient.get<ApiResponse<ProductCategory>>(`/product-categories/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateProductCategoryRequest): Promise<ProductCategory> => {
    const response = await apiClient.post<ApiResponse<ProductCategory>>('/product-categories', data);
    return response.data.data!;
  },

  update: async (id: string, data: CreateProductCategoryRequest): Promise<ProductCategory> => {
    const response = await apiClient.put<ApiResponse<ProductCategory>>(`/product-categories/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/product-categories/${id}`);
  },
};

export default productCategoriesApi;
