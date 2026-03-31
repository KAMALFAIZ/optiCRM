import apiClient from './client';
import type { Tenant, SubscriptionPlan } from '@/types/tenant';
import type { ApiResponse } from '@/types/api';

export const tenantApi = {
  getCurrentTenant: () =>
    apiClient.get<ApiResponse<Tenant>>('/tenants/current'),

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
