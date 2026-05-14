import apiClient from './client';

export interface FieldMappingDto {
  id: string;
  champSource: string;
  champOpticrm: string;
  actif: boolean;
}

export interface MappingItem {
  champSource: string;
  champOpticrm: string;
  actif: boolean;
}

export interface SaveMappingsRequest {
  mappings: MappingItem[];
}

export interface ImportResultDto {
  total: number;
  created: number;
  updated: number;
  errors: number;
  message: string;
}

export type EntityType = 'ACCOUNTS' | 'PRODUCTS';

export const integrationApi = {
  getMappings: (type: EntityType = 'ACCOUNTS') =>
    apiClient.get<{ data: FieldMappingDto[] }>('/integration/mappings', { params: { type } })
      .then(r => r.data.data),

  saveMappings: (req: SaveMappingsRequest, type: EntityType = 'ACCOUNTS') =>
    apiClient.post<{ data: FieldMappingDto[] }>('/integration/mappings', req, { params: { type } })
      .then(r => r.data.data),

  importCsv: (file: File, type: EntityType = 'ACCOUNTS') => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ data: ImportResultDto }>('/integration/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { type },
      timeout: 300_000,
    }).then(r => r.data.data);
  },

  executeQuery: (sqlQuery: string, type: EntityType = 'ACCOUNTS') =>
    apiClient.post<{ data: ImportResultDto }>('/integration/execute-query', { sqlQuery }, {
      params: { type },
      timeout: 300_000,
    }).then(r => r.data.data),

  deleteImportedAccounts: () =>
    apiClient.delete<{ data: number }>('/integration/imported-accounts')
      .then(r => r.data.data),

  deleteAllAccounts: () =>
    apiClient.delete('/integration/all-accounts'),

  deleteAllProducts: () =>
    apiClient.delete<{ data: number }>('/integration/all-products')
      .then(r => r.data.data),
};
