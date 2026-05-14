import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import paymentsApi, { PaymentsQueryParams, CreatePaymentRequest } from '../api/payments';
import { useAuthStore } from '../stores/authStore';

export function usePayments(params: PaymentsQueryParams = {}) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentsApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function usePayment(id: string) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentsApi.getById(id),
    enabled: isHydrated && !!accessToken && !!id,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); },
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePaymentRequest> }) =>
      paymentsApi.update(id, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payment', variables.id] });
    },
  });
}
