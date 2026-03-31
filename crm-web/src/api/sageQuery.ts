import apiClient from './client';

export const sageQueryApi = {
  fetchAccounts: (): Promise<Record<string, string>[]> =>
    apiClient.get('/sage/query/accounts').then(r => r.data.data),

  fetchContacts: (): Promise<Record<string, string>[]> =>
    apiClient.get('/sage/query/contacts').then(r => r.data.data),

  executeQuery: (query: string, entityType: string): Promise<Record<string, string>[]> =>
    apiClient.post('/sage/query/execute', { query, entityType }).then(r => r.data.data),

  testConnection: (): Promise<void> =>
    apiClient.get('/sage/query/test').then(() => undefined),
};
