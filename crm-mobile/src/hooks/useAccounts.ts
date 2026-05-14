import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi, AccountsQueryParams } from '../api/accounts';
import type { CreateAccountRequest, UpdateAccountRequest } from '../types/account';
import { useAuthStore } from '../stores/authStore';

export function useAccounts(params: AccountsQueryParams = {}) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['accounts', params],
    queryFn: () => accountsApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: () => accountsApi.getById(id),
    enabled: !!id,
  });
}

export function useAccountStats(id: string) {
  return useQuery({
    queryKey: ['accounts', id, 'stats'],
    queryFn: () => accountsApi.getStats(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountRequest }) => accountsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); },
  });
}

export function useSearchAccounts(query: string) {
  return useQuery({
    queryKey: ['accounts', 'search', query],
    queryFn: () => accountsApi.search(query),
    enabled: query.length >= 2,
  });
}
