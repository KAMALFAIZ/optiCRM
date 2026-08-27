import apiClient from './client';
import { ApiResponse, PagedResponse } from '../types/api';

export interface ChantierActeurDto {
  id: string;
  roleActeur: string;
  nom: string;
  telephone?: string;
}

export interface ChantierDto {
  id: string;
  nom: string;
  ville?: string;
  prefecture?: string;
  latitude?: number;
  longitude?: number;
  adresse?: string;
  typeProjet?: string;
  sousTypeProjet?: string;
  nombreUnites?: number;
  segmentTaille?: string; // S/M/L/XL calculé
  stadeChantier?: string;
  stadeChangedAt?: string;
  niveauOpportunite?: string;
  concurrentFerme?: string;
  deciseur?: string;
  statutChantier?: string;
  actionSuivante?: string;
  dateProchaineAction?: string;
  temoin?: boolean;
  installateur?: string;
  promoteur?: string;
  acteurs?: ChantierActeurDto[];
  account?: { id: string; name: string; billingCity?: string };
  assignedTo?: { id: string; fullName: string; email: string };
  territory?: { id: string; name: string; region: string };
  createdAt?: string;
  updatedAt?: string;
  healthScore?: number;
  conversionProbability?: number;
  aiSummary?: string;
  lastAiAnalysisAt?: string;
}

export interface ChantierListItem {
  id: string;
  nom: string;
  ville?: string;
  prefecture?: string;
  typeProjet?: string;
  sousTypeProjet?: string;
  nombreUnites?: number;
  segmentTaille?: string;
  stadeChantier?: string;
  niveauOpportunite?: string;
  statutChantier?: string;
  accountId?: string;
  accountName?: string;
  assignedToName?: string;
  dateProchaineAction?: string;
  latitude?: number;
  longitude?: number;
  temoin?: boolean;
  healthScore?: number;
  conversionProbability?: number;
}

export interface CreateChantierRequest {
  nom: string;
  ville?: string;
  prefecture?: string;
  latitude?: number;
  longitude?: number;
  adresse?: string;
  typeProjet?: string;
  sousTypeProjet?: string;
  nombreUnites?: number;
  stadeChantier?: string;
  niveauOpportunite?: string;
  concurrentFerme?: string;
  deciseur?: string;
  statutChantier?: string;
  actionSuivante?: string;
  dateProchaineAction?: string;
  accountId?: string;
  assignedToId?: string;
  territoryId?: string;
  temoin?: boolean;
  installateur?: string;
  promoteur?: string;
  acteurs?: { roleActeur: string; nom: string; telephone?: string }[];
}

export interface EchantillonLigneDto {
  id: string;
  productId?: string;
  productCode: string;
  productName: string;
  quantite: number;
}

export interface ChantierPhotoDto {
  id: string;
  url: string;
  originalName?: string;
  uploadedBy?: string;
  createdAt?: string;
}

export interface ChantierEchantillonDto {
  id: string;
  notes?: string;
  statut: string;
  requestedBy?: string;
  createdAt: string;
  lignes: EchantillonLigneDto[];
}

export interface CreateEchantillonRequest {
  notes?: string;
  lignes: { productId?: string; productCode: string; productName: string; quantite: number }[];
}

export interface ChantiersQueryParams {
  page?: number;
  size?: number;
  search?: string;
  stadeChantier?: string;
  statutChantier?: string;
  typeProjet?: string;
  assignedToId?: string;
  accountId?: string;
  temoin?: boolean;
}

/** Filtres de l'export : on reprend ceux de la liste, sans la pagination. */
export type ChantiersExportFilters = Omit<ChantiersQueryParams, 'page' | 'size'>;

/** Déclenche le téléchargement d'un blob reçu de l'API. */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const today = () => new Date().toISOString().split('T')[0];

export const chantiersApi = {
  getAll: async (params: ChantiersQueryParams = {}): Promise<PagedResponse<ChantierListItem>> => {
    const response = await apiClient.get<ApiResponse<ChantierListItem[]>>('/chantiers', {
      params: { page: params.page || 1, perPage: params.size || 20, ...params },
    });
    const meta = response.data.meta;
    return {
      content: response.data.data || [],
      page: meta?.page || 0,
      size: meta?.perPage || 20,
      totalElements: meta?.total || 0,
      totalPages: meta?.totalPages || 0,
      meta: { page: meta?.page || 0, size: meta?.perPage || 20, totalElements: meta?.total || 0, totalPages: meta?.totalPages || 0 },
    };
  },

  getById: async (id: string): Promise<ChantierDto> => {
    const response = await apiClient.get<ApiResponse<ChantierDto>>(`/chantiers/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateChantierRequest): Promise<ChantierDto> => {
    const response = await apiClient.post<ApiResponse<ChantierDto>>('/chantiers', data);
    return response.data.data!;
  },

  update: async (id: string, data: Partial<CreateChantierRequest>): Promise<ChantierDto> => {
    const response = await apiClient.put<ApiResponse<ChantierDto>>(`/chantiers/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/chantiers/${id}`);
  },

  addActeur: async (id: string, acteur: { roleActeur: string; nom: string; telephone?: string }): Promise<ChantierActeurDto> => {
    const response = await apiClient.post<ApiResponse<ChantierActeurDto>>(`/chantiers/${id}/acteurs`, acteur);
    return response.data.data!;
  },

  removeActeur: async (chantierId: string, acteurId: string): Promise<void> => {
    await apiClient.delete(`/chantiers/${chantierId}/acteurs/${acteurId}`);
  },

  // Chantiers liés à un compte
  getByAccount: async (accountId: string): Promise<ChantierListItem[]> => {
    const response = await apiClient.get<ApiResponse<ChantierListItem[]>>(`/chantiers/by-account/${accountId}`);
    return response.data.data || [];
  },

  // Demandes d'échantillons
  createEchantillon: async (chantierId: string, data: CreateEchantillonRequest): Promise<ChantierEchantillonDto> => {
    const response = await apiClient.post<ApiResponse<ChantierEchantillonDto>>(`/chantiers/${chantierId}/echantillons`, data);
    return response.data.data!;
  },

  getEchantillons: async (chantierId: string): Promise<ChantierEchantillonDto[]> => {
    const response = await apiClient.get<ApiResponse<ChantierEchantillonDto[]>>(`/chantiers/${chantierId}/echantillons`);
    return response.data.data || [];
  },

  // Photos du chantier
  uploadPhoto: async (chantierId: string, file: File): Promise<ChantierPhotoDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<ChantierPhotoDto>>(
      `/chantiers/${chantierId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!;
  },

  getPhotos: async (chantierId: string): Promise<ChantierPhotoDto[]> => {
    const response = await apiClient.get<ApiResponse<ChantierPhotoDto[]>>(`/chantiers/${chantierId}/photos`);
    return response.data.data || [];
  },

  deletePhoto: async (chantierId: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/chantiers/${chantierId}/photos/${photoId}`);
  },

  // Export de la liste (mêmes filtres que l'affichage), coordonnées GPS incluses
  exportExcel: async (filters: ChantiersExportFilters = {}): Promise<void> => {
    const response = await apiClient.get('/chantiers/export/excel', {
      params: filters,
      responseType: 'blob',
    });
    downloadBlob(response.data, `chantiers_${today()}.xlsx`);
  },

  exportPdf: async (filters: ChantiersExportFilters = {}): Promise<void> => {
    const response = await apiClient.get('/chantiers/export/pdf', {
      params: filters,
      responseType: 'blob',
    });
    downloadBlob(response.data, `chantiers_${today()}.pdf`);
  },

  // Pour la carte interactive
  getMapData: async (): Promise<ChantierListItem[]> => {
    const response = await apiClient.get<ApiResponse<ChantierListItem[]>>('/chantiers/map');
    return response.data.data || [];
  },

  // AI features
  computeHealth: async (id: string): Promise<ChantierHealthResponse> => {
    const response = await apiClient.post<ApiResponse<ChantierHealthResponse>>(`/ai/chantier/${id}/health`);
    return response.data.data!;
  },

  analyzeChantier: async (id: string): Promise<string> => {
    const response = await apiClient.post<ApiResponse<string>>(`/ai/chantier/${id}/analyze`);
    return response.data.data!;
  },

  getGeoInsights: async (): Promise<string> => {
    const response = await apiClient.get<ApiResponse<string>>('/ai/chantier/geo-insights');
    return response.data.data!;
  },

  extractDocument: async (documentText: string, documentType?: string): Promise<ChantierExtractResponse> => {
    const response = await apiClient.post<ApiResponse<ChantierExtractResponse>>('/ai/chantier/extract-document', {
      documentText,
      documentType: documentType || 'AUTRE',
    });
    return response.data.data!;
  },

  extractFromImage: async (file: File): Promise<ChantierExtractResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<ChantierExtractResponse>>(
      '/ai/chantier/extract-image',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!;
  },
};

export interface ChantierHealthResponse {
  score: number;
  label: 'CRITIQUE' | 'A_RISQUE' | 'ATTENTION' | 'BON' | 'EXCELLENT';
  color: 'red' | 'orange' | 'gold' | 'green' | 'cyan';
  detail: string;
  scoreVisites: number;
  scorePipeline: number;
  scoreOpportunite: number;
  scoreProfil: number;
}

export interface ChantierExtractResponse {
  nomChantier?: string;
  maitrOuvrage?: string;
  ville?: string;
  typeProjet?: string;
  sousTypeProjet?: string;
  stadeChantier?: string;
  nombreUnites?: number;
  productsDetected?: string;
  delais?: string;
  contacts?: string;
  rawSummary?: string;
}

export default chantiersApi;
