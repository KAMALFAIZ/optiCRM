import apiClient from './client';

export interface ImportResult {
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportPreview {
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
  detectedMapping: Record<string, string>;
}

export const importExportApi = {
  exportEntity: async (
    entity: string,
    format: 'excel' | 'csv' = 'excel',
    filters?: Record<string, string>,
  ): Promise<Blob> => {
    const response = await apiClient.get(`/export/${entity}`, {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return response.data;
  },

  importEntity: async (
    entity: string,
    file: File,
    mapping?: Record<string, string>,
  ): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) {
      formData.append('mapping', JSON.stringify(mapping));
    }
    const response = await apiClient.post<{ data: ImportResult }>(
      `/import/${entity}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data.data;
  },

  previewImport: async (entity: string, file: File): Promise<ImportPreview> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ data: ImportPreview }>(
      `/import/${entity}/preview`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data.data;
  },
};

export default importExportApi;
