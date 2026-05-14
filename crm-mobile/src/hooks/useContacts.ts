import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, ContactsQueryParams } from '../api/contacts';
import type { CreateContactRequest, UpdateContactRequest } from '../types/contact';
import { useAuthStore } from '../stores/authStore';

export function useContacts(params: ContactsQueryParams = {}) {
  const { isHydrated, accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.getAll(params),
    enabled: isHydrated && !!accessToken,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactRequest) => contactsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactRequest }) => contactsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); },
  });
}

export function useSearchContacts(query: string, accountId?: string) {
  return useQuery({
    queryKey: ['contacts', 'search', query, accountId],
    queryFn: () => contactsApi.getAll({ search: query, accountId, size: 10, page: 1 }),
    enabled: query.length >= 2 || !!accountId,
    select: (data) => data.content,
  });
}
