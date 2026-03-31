import apiClient from './client';
import type { ApiResponse } from '@/types/api';

export interface ReferenceDataItem {
  id: string;
  category: string;
  value: string;
  label: string;
  color?: string;
  sortOrder: number;
  active: boolean;
}

export type ReferenceDataMap = Record<string, ReferenceDataItem[]>;

export const REFERENCE_CATEGORIES = {
  CATEGORIE_CLIENT: 'CATEGORIE_CLIENT',
  SOCIETE_AFFECTATION: 'SOCIETE_AFFECTATION',
  TYPE_COMPTE: 'TYPE_COMPTE',
  TYPE_COMPTE_ODYSSEE: 'TYPE_COMPTE_ODYSSEE',
  TYPE_PROJET: 'TYPE_PROJET',
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  CATEGORIE_CLIENT: 'Catégorie client',
  SOCIETE_AFFECTATION: "Société d'affectation",
  TYPE_COMPTE: 'Type de compte',
  TYPE_COMPTE_ODYSSEE: 'Type de compte ODYSSÉE',
  TYPE_PROJET: 'Type de projet',
};

export const referenceDataApi = {
  /** Toutes les données groupées par catégorie */
  getAll: async (): Promise<ReferenceDataMap> => {
    const res = await apiClient.get<ApiResponse<ReferenceDataMap>>('/reference-data');
    return res.data.data!;
  },

  /** Données d'une catégorie (toutes, y compris inactives) */
  getByCategory: async (category: string): Promise<ReferenceDataItem[]> => {
    const res = await apiClient.get<ApiResponse<ReferenceDataItem[]>>(
      `/reference-data/category/${category}`
    );
    return res.data.data!;
  },

  /** Données actives uniquement (pour les formulaires) */
  getActiveByCategory: async (category: string): Promise<ReferenceDataItem[]> => {
    const res = await apiClient.get<ApiResponse<ReferenceDataItem[]>>(
      `/reference-data/category/${category}/active`
    );
    return res.data.data!;
  },

  create: async (data: Omit<ReferenceDataItem, 'id'>): Promise<ReferenceDataItem> => {
    const res = await apiClient.post<ApiResponse<ReferenceDataItem>>('/reference-data', data);
    return res.data.data!;
  },

  update: async (id: string, data: Partial<ReferenceDataItem>): Promise<ReferenceDataItem> => {
    const res = await apiClient.put<ApiResponse<ReferenceDataItem>>(`/reference-data/${id}`, data);
    return res.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reference-data/${id}`);
  },
};
