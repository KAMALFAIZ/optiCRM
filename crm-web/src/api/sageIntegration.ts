import apiClient from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncEntityType = 'ACCOUNTS' | 'CONTACTS' | 'CA' | 'OBJECTIVES' | 'PRODUCTS' | 'INVENTORY' | 'VENTES' | 'BALANCE_AGEE';
export type SyncStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR' | 'CANCELLED';
export type SyncAction = 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';

export interface SageSyncItemDto {
  id: string;
  rowIndex: number;
  sageRef: string | null;
  crmId: string | null;
  crmName?: string | null;
  action: SyncAction;
  status: string;
  rawData: Record<string, unknown>;
  mappedData?: Record<string, unknown> | null;
  diffData?: Record<string, Record<string, unknown>> | null;
  errorMessage?: string | null;
}

export interface SageSyncRequestDto {
  id: string;
  entityType: SyncEntityType;
  label: string | null;
  sourceFormat: string;
  status: SyncStatus;
  totalItems: number;
  processedItems: number;
  successItems: number;
  errorItems: number;
  skipItems: number;
  periodYear?: number | null;
  periodMonth?: number | null;
  createdByName?: string | null;
  processedAt?: string | null;
  createdAt: string;
  items?: SageSyncItemDto[];
}

export interface CreateSyncRequestRequest {
  entityType: SyncEntityType;
  label?: string;
  sourceFormat?: 'CSV' | 'MANUAL' | 'SQL';
  periodYear?: number;
  periodMonth?: number;
  rows: Record<string, unknown>[];
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

/** Parse une chaîne TSV/CSV collée depuis Excel en tableau de Maps */
export function parsePastedData(
  raw: string,
  headers: string[]
): Record<string, unknown>[] {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  // Si la première ligne correspond aux headers Sage → skip
  const firstCols = lines[0].split(/\t|;/).map(s => s.trim().toLowerCase());
  const isHeader = headers.some(h => firstCols.includes(h.toLowerCase()));
  const dataLines = isHeader ? lines.slice(1) : lines;

  return dataLines.map(line => {
    const cols = line.split(/\t|;/);
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? '').trim();
    });
    return row;
  }).filter(r => Object.values(r).some(v => v !== ''));
}

// ─── API calls ────────────────────────────────────────────────────────────────

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

const LONG_TIMEOUT = { timeout: 1_800_000 }; // 30 min — imports volumineux

const sageIntegrationApi = {
  /** Créer une requête de sync (génère le preview automatiquement) */
  createRequest: async (req: CreateSyncRequestRequest): Promise<SageSyncRequestDto> => {
    const res = await apiClient.post<{ data: SageSyncRequestDto }>('/sage/sync/requests', req, LONG_TIMEOUT);
    return res.data.data;
  },

  /** Appliquer la requête (écriture en base CRM) */
  applyRequest: async (id: string): Promise<SageSyncRequestDto> => {
    const res = await apiClient.post<{ data: SageSyncRequestDto }>(`/sage/sync/requests/${id}/apply`, null, LONG_TIMEOUT);
    return res.data.data;
  },

  /** Annuler */
  cancelRequest: async (id: string): Promise<void> => {
    await apiClient.post(`/sage/sync/requests/${id}/cancel`);
  },

  /** Lister les requêtes */
  listRequests: async (
    entityType?: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<SageSyncRequestDto>> => {
    const params: Record<string, unknown> = { page, size };
    if (entityType) params.entityType = entityType;
    const res = await apiClient.get<{ data: PageResponse<SageSyncRequestDto> }>('/sage/sync/requests', { params });
    return res.data.data;
  },

  /** Détail d'une requête */
  getRequest: async (id: string): Promise<SageSyncRequestDto> => {
    const res = await apiClient.get<{ data: SageSyncRequestDto }>(`/sage/sync/requests/${id}`);
    return res.data.data;
  },
};

export default sageIntegrationApi;
