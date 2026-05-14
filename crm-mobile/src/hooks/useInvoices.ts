import { useQuery } from '@tanstack/react-query';
import invoicesApi, { InvoicesQueryParams } from '../api/invoices';
import { useAuthStore } from '../stores/authStore';

export function useInvoices(params: InvoicesQueryParams = {}) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useInvoice(id: string) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getById(id),
    enabled: isHydrated && !!accessToken && !!id,
  });
}
