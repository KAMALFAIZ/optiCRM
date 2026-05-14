import axios from 'axios';
import apiClient from './client';
import type { Tenant, SubscriptionPlan, TenantPublicInfo } from '@/types/tenant';
import type { ApiResponse } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const tenantApi = {
  getCurrentTenant: () =>
    apiClient.get<ApiResponse<Tenant>>('/tenants/current'),

  resolveSlug: (slug: string) =>
    axios.get<TenantPublicInfo>(`${BASE_URL}/public/tenants/resolve`, { params: { slug } }),

  getSubscriptionPlans: () =>
    apiClient.get<ApiResponse<SubscriptionPlan[]>>('/public/subscription-plans'),

  checkSlug: (slug: string) =>
    apiClient.get<ApiResponse<{ available: boolean }>>(`/public/tenants/check-slug?slug=${slug}`),

  registerTenant: (data: {
    slug: string;
    companyName: string;
    adminEmail: string;
    planId: string;
  }) => apiClient.post<ApiResponse<{ tenantId: string; slug: string }>>('/public/tenants/register', data),

  getSetupStatus: () =>
    apiClient.get<{ configured: boolean; licenseStatus: string; message: string }>('/public/setup-status'),
};
