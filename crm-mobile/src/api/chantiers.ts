import apiClient from './client';

export interface ChantierListItem {
  id: string;
  nom: string;
  ville?: string;
  prefecture?: string;
  typeProjet?: string;
  stadeChantier?: string;
  niveauOpportunite?: string;
  statutChantier?: string;
  accountName?: string;
  assignedToName?: string;
  dateProchaineAction?: string;
  healthScore?: number;
  conversionProbability?: number;
  latitude?: number;
  longitude?: number;
}

export interface ChantierDetail extends ChantierListItem {
  adresse?: string;
  sousTypeProjet?: string;
  nombreUnites?: number;
  concurrentFerme?: string;
  deciseur?: string;
  actionSuivante?: string;
  installateur?: string;
  promoteur?: string;
  aiSummary?: string;
  acteurs?: { id: string; roleActeur: string; nom: string; telephone?: string }[];
  account?: { id: string; name: string };
  assignedTo?: { id: string; fullName: string };
}

export interface CreateChantierRequest {
  nom: string;
  ville?: string;
  prefecture?: string;
  adresse?: string;
  typeProjet?: string;
  sousTypeProjet?: string;
  nombreUnites?: number;
  stadeChantier?: string;
  niveauOpportunite?: string;
  statutChantier?: string;
  actionSuivante?: string;
  dateProchaineAction?: string;
  accountId?: string;
  assignedToId?: string;
  concurrentFerme?: string;
  deciseur?: string;
}

export interface ChantiersQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  stadeChantier?: string;
  statutChantier?: string;
  assignedToId?: string;
}

export const chantiersApi = {
  getAll: async (params: ChantiersQueryParams = {}) => {
    const response = await apiClient.get('/chantiers', {
      params: { page: params.page || 1, perPage: params.perPage || 20, ...params },
    });
    return { content: response.data.data || [], meta: response.data.meta };
  },
  getById: async (id: string): Promise<ChantierDetail> => {
    const response = await apiClient.get(`/chantiers/${id}`);
    return response.data.data;
  },
  create: async (data: CreateChantierRequest): Promise<ChantierDetail> => {
    const response = await apiClient.post('/chantiers', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<CreateChantierRequest>): Promise<ChantierDetail> => {
    const response = await apiClient.put(`/chantiers/${id}`, data);
    return response.data.data;
  },
  analyzeAI: async (id: string): Promise<string> => {
    const response = await apiClient.post(`/ai/chantier/${id}/analyze`);
    return response.data.data;
  },
};
export default chantiersApi;
