import { useQueries } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { ApiResponse } from '../types/api';
import type { DashboardStats } from '../types/dashboard';

export function useDashboard() {
  const { isHydrated, accessToken } = useAuthStore();
  const enabled = isHydrated && !!accessToken;

  const [accountsQ, leadsQ, oppsQ, visitsQ] = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'accounts-count'],
        queryFn: async () => {
          const r = await apiClient.get<ApiResponse<unknown>>('/accounts?page=1&size=1');
          return r.data.meta?.total ?? r.data.meta?.totalElements ?? 0;
        },
        enabled,
        retry: false,
      },
      {
        queryKey: ['dashboard', 'leads-count'],
        queryFn: async () => {
          const r = await apiClient.get<ApiResponse<unknown>>('/leads?page=1&size=1');
          return r.data.meta?.total ?? r.data.meta?.totalElements ?? 0;
        },
        enabled,
        retry: false,
      },
      {
        queryKey: ['dashboard', 'opps-count'],
        queryFn: async () => {
          const r = await apiClient.get<ApiResponse<unknown>>('/opportunities?page=1&size=1');
          return r.data.meta?.total ?? r.data.meta?.totalElements ?? 0;
        },
        enabled,
        retry: false,
      },
      {
        queryKey: ['dashboard', 'visits-today'],
        queryFn: async () => {
          const r = await apiClient.get<ApiResponse<unknown>>('/visits?page=1&size=1');
          return r.data.meta?.total ?? r.data.meta?.totalElements ?? 0;
        },
        enabled,
        retry: false,
      },
    ],
  });

  const isLoading = [accountsQ, leadsQ, oppsQ, visitsQ].some(q => q.isLoading);
  const isError = [accountsQ, leadsQ, oppsQ, visitsQ].every(q => q.isError);

  const data: Partial<DashboardStats> | undefined = (!isLoading && !isError) ? {
    totalAccounts: accountsQ.data ?? undefined,
    totalLeads: leadsQ.data ?? undefined,
    pipelineTotal: undefined,
    wonThisMonth: undefined,
    revenueThisMonth: undefined,
    conversionRate: undefined,
  } : undefined;

  const error = leadsQ.error;
  const refetch = () => { accountsQ.refetch(); leadsQ.refetch(); oppsQ.refetch(); visitsQ.refetch(); };

  return { data, isLoading, isError: false, error, refetch };
}
