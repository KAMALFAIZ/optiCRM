import apiClient from './client';
import type {
  Vehicule,
  StockVoiture,
  Chargement,
  BonLivraison,
  CreateBonLivraisonRequest,
  RetourVoiture,
  CreateRetourRequest,
  StatutBonLivraison,
} from '../types/vanSelling';

// ─── Véhicules ────────────────────────────────────────────────────────────────

export const vehiculesApi = {
  getAll: async (): Promise<Vehicule[]> => {
    const res = await apiClient.get('/vehicules');
    return res.data.data;
  },

  getById: async (id: string): Promise<Vehicule> => {
    const res = await apiClient.get(`/vehicules/${id}`);
    return res.data.data;
  },

  getByCollaborateur: async (collaborateurId: string): Promise<Vehicule> => {
    const res = await apiClient.get(`/vehicules/by-collaborateur/${collaborateurId}`);
    return res.data.data;
  },

  getStock: async (vehiculeId: string): Promise<StockVoiture[]> => {
    const res = await apiClient.get(`/vehicules/${vehiculeId}/stock`);
    return res.data.data;
  },

  getStockDisponible: async (vehiculeId: string): Promise<StockVoiture[]> => {
    const res = await apiClient.get(`/vehicules/${vehiculeId}/stock/disponible`);
    return res.data.data;
  },
};

// ─── Chargements ──────────────────────────────────────────────────────────────

export const chargementsApi = {
  list: async (vehiculeId: string, page = 0, size = 20): Promise<{ content: Chargement[]; totalElements: number }> => {
    const res = await apiClient.get('/chargements', { params: { vehiculeId, page, size } });
    return res.data.data;
  },

  getById: async (id: string): Promise<Chargement> => {
    const res = await apiClient.get(`/chargements/${id}`);
    return res.data.data;
  },
};

// ─── Bons de livraison ────────────────────────────────────────────────────────

export const bonsLivraisonApi = {
  list: async (params: {
    vehiculeId?: string;
    collaborateurId?: string;
    statut?: StatutBonLivraison;
    page?: number;
    size?: number;
  }): Promise<{ content: BonLivraison[]; totalElements: number }> => {
    const res = await apiClient.get('/bons-livraison', { params: { page: 0, size: 30, ...params } });
    return res.data.data;
  },

  getById: async (id: string): Promise<BonLivraison> => {
    const res = await apiClient.get(`/bons-livraison/${id}`);
    return res.data.data;
  },

  create: async (data: CreateBonLivraisonRequest): Promise<BonLivraison> => {
    const res = await apiClient.post('/bons-livraison', data);
    return res.data.data;
  },

  valider: async (id: string): Promise<BonLivraison> => {
    const res = await apiClient.post(`/bons-livraison/${id}/valider`);
    return res.data.data;
  },

  livrer: async (id: string): Promise<BonLivraison> => {
    const res = await apiClient.post(`/bons-livraison/${id}/livrer`);
    return res.data.data;
  },

  annuler: async (id: string): Promise<BonLivraison> => {
    const res = await apiClient.post(`/bons-livraison/${id}/annuler`);
    return res.data.data;
  },

  enregistrerSignature: async (id: string, signatureUrl: string): Promise<BonLivraison> => {
    const res = await apiClient.put(`/bons-livraison/${id}/signature`, null, {
      params: { signatureUrl },
    });
    return res.data.data;
  },
};

// ─── Retours voiture ──────────────────────────────────────────────────────────

export const retoursApi = {
  list: async (vehiculeId: string, page = 0, size = 20) => {
    const res = await apiClient.get('/retours-voiture', { params: { vehiculeId, page, size } });
    return res.data.data;
  },

  create: async (data: CreateRetourRequest): Promise<RetourVoiture> => {
    const res = await apiClient.post('/retours-voiture', data);
    return res.data.data;
  },
};
