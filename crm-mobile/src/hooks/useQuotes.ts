import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import quotesApi, { QuotesQueryParams, QuoteStatus, CreateQuoteRequest } from '../api/quotes';
import { useAuthStore } from '../stores/authStore';

export function useQuotes(params: QuotesQueryParams = {}) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: () => quotesApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useQuote(id: string) {
  const { accessToken, isHydrated } = useAuthStore();
  return useQuery({
    queryKey: ['quote', id],
    queryFn: () => quotesApi.getById(id),
    enabled: isHydrated && !!accessToken && !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuoteRequest) => quotesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); },
  });
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      quotesApi.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['quote', variables.id] });
    },
  });
}

export function useDuplicateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotesApi.duplicate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); },
  });
}
