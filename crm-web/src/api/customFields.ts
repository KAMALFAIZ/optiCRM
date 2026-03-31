import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface CustomFieldDef {
  id: string;
  fieldName: string;
  fieldKey: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN';
  options: string[];
  sortOrder: number;
  required: boolean;
  active: boolean;
}

export interface CustomFieldValue {
  id: string | null;
  fieldId: string;
  fieldKey: string;
  fieldName: string;
  fieldType: string;
  value: string | null;
}

export const customFieldsApi = {
  // ── Field definitions (admin) ─────────────────────────────────────
  getAllFields: async (): Promise<CustomFieldDef[]> => {
    const res = await apiClient.get<ApiResponse<CustomFieldDef[]>>('/custom-fields');
    return res.data.data!;
  },

  getActiveFields: async (): Promise<CustomFieldDef[]> => {
    const res = await apiClient.get<ApiResponse<CustomFieldDef[]>>('/custom-fields/active');
    return res.data.data!;
  },

  createField: async (data: Omit<CustomFieldDef, 'id'>): Promise<CustomFieldDef> => {
    const res = await apiClient.post<ApiResponse<CustomFieldDef>>('/custom-fields', data);
    return res.data.data!;
  },

  updateField: async (id: string, data: Partial<CustomFieldDef>): Promise<CustomFieldDef> => {
    const res = await apiClient.put<ApiResponse<CustomFieldDef>>(`/custom-fields/${id}`, data);
    return res.data.data!;
  },

  deleteField: async (id: string): Promise<void> => {
    await apiClient.delete(`/custom-fields/${id}`);
  },

  // ── Field values (per account) ────────────────────────────────────
  getAccountValues: async (accountId: string): Promise<CustomFieldValue[]> => {
    const res = await apiClient.get<ApiResponse<CustomFieldValue[]>>(
      `/custom-fields/accounts/${accountId}/values`
    );
    return res.data.data!;
  },

  saveAccountValues: async (
    accountId: string,
    values: Record<string, string | null>
  ): Promise<CustomFieldValue[]> => {
    const res = await apiClient.put<ApiResponse<CustomFieldValue[]>>(
      `/custom-fields/accounts/${accountId}/values`,
      values
    );
    return res.data.data!;
  },
};
