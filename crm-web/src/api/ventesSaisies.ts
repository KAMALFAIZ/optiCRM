import apiClient from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VenteSaisieDto {
  id: string;
  accountId: string | null;
  accountName: string | null;
  createdById: string | null;
  createdByName: string | null;
  reference: string | null;
  dateVente: string; // LocalDate → ISO string
  montantHt: number;
  montantTtc: number;
  description: string | null;
  statut: 'CONFIRME' | 'EN_ATTENTE' | 'ANNULE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateVenteSaisieRequest {
  accountId: string;
  reference?: string;
  dateVente: string; // YYYY-MM-DD
  montantHt: number;
  montantTtc: number;
  description?: string;
  statut?: string;
}

export interface UpdateVenteSaisieRequest {
  accountId?: string;
  reference?: string;
  dateVente?: string;
  montantHt?: number;
  montantTtc?: number;
  description?: string;
  statut?: string;
}

export interface VenteSaisiesPage {
  content: VenteSaisieDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const ventesSaisiesApi = {
  findAll: (params?: {
    accountId?: string;
    dateFrom?: string;
    dateTo?: string;
    statut?: string;
    page?: number;
    size?: number;
  }): Promise<VenteSaisiesPage> =>
    apiClient.get('/ventes-saisies', { params }).then(r => r.data.data),

  findById: (id: string): Promise<VenteSaisieDto> =>
    apiClient.get(`/ventes-saisies/${id}`).then(r => r.data.data),

  findByAccount: (accountId: string): Promise<VenteSaisieDto[]> =>
    apiClient.get(`/ventes-saisies/account/${accountId}`).then(r => r.data.data),

  create: (request: CreateVenteSaisieRequest): Promise<VenteSaisieDto> =>
    apiClient.post('/ventes-saisies', request).then(r => r.data.data),

  update: (id: string, request: UpdateVenteSaisieRequest): Promise<VenteSaisieDto> =>
    apiClient.put(`/ventes-saisies/${id}`, request).then(r => r.data.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/ventes-saisies/${id}`).then(() => undefined),
};

export default ventesSaisiesApi;
