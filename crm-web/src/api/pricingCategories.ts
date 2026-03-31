import apiClient from './client';
import { ApiResponse } from '../types/api';
import {
  PricingCategory,
  CreatePricingCategoryRequest,
  UpdatePricingCategoryRequest,
  ProductPrice,
  SetProductPriceRequest,
} from '../types/pricingCategory';

export const pricingCategoriesApi = {
  getAll: async (): Promise<PricingCategory[]> => {
    const response = await apiClient.get<ApiResponse<PricingCategory[]>>('/pricing-categories');
    return response.data.data || [];
  },

  getActive: async (): Promise<PricingCategory[]> => {
    const response = await apiClient.get<ApiResponse<PricingCategory[]>>('/pricing-categories/active');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<PricingCategory> => {
    const response = await apiClient.get<ApiResponse<PricingCategory>>(`/pricing-categories/${id}`);
    return response.data.data!;
  },

  create: async (data: CreatePricingCategoryRequest): Promise<PricingCategory> => {
    const response = await apiClient.post<ApiResponse<PricingCategory>>('/pricing-categories', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdatePricingCategoryRequest): Promise<PricingCategory> => {
    const response = await apiClient.put<ApiResponse<PricingCategory>>(`/pricing-categories/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/pricing-categories/${id}`);
  },
};

export const productPricesApi = {
  getPrices: async (productId: string): Promise<ProductPrice[]> => {
    const response = await apiClient.get<ApiResponse<ProductPrice[]>>(`/products/${productId}/prices`);
    return response.data.data || [];
  },

  setPrice: async (productId: string, data: SetProductPriceRequest): Promise<ProductPrice> => {
    const response = await apiClient.put<ApiResponse<ProductPrice>>(`/products/${productId}/prices`, data);
    return response.data.data!;
  },

  deletePrice: async (productId: string, categoryId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/prices/${categoryId}`);
  },
};

export default pricingCategoriesApi;
