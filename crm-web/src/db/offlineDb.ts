import Dexie, { type Table } from 'dexie';

// ── Types stockés en local ────────────────────────────────────────────────────

export interface OfflineAccount {
  id: string;
  name: string;
  accountType?: string;
  societeAffectation?: string;
  categorieClient?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  billingCity?: string;
  billingCountry?: string;
  [key: string]: unknown;
}

export interface OfflineContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  accountId?: string;
  accountName?: string;
  [key: string]: unknown;
}

export interface OfflineLead {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  status?: string;
  [key: string]: unknown;
}

export interface OfflineOpportunity {
  id: string;
  name: string;
  stage?: string;
  amount?: number;
  accountId?: string;
  [key: string]: unknown;
}

// Statut d'une mutation en file d'attente
export type MutationStatus = 'pending' | 'conflict' | 'failed';

// Mutations en attente (écrites offline, à synchroniser au retour du réseau)
export interface PendingMutation {
  id?: number; // auto-increment
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  createdAt: number; // timestamp
  retries: number;
  // Gestion des conflits
  status: MutationStatus;
  entityVersion?: number;  // version de l'entité au moment de la modification
  entityType?: string;     // 'account' | 'contact' | 'lead' | 'opportunity'
  entityId?: string;       // UUID de l'entité
  serverData?: unknown;    // données serveur en cas de conflit 409
  errorMessage?: string;   // message d'erreur pour les mutations échouées
}

// ── Base Dexie ────────────────────────────────────────────────────────────────

class OptiCRMOfflineDB extends Dexie {
  accounts!: Table<OfflineAccount>;
  contacts!: Table<OfflineContact>;
  leads!: Table<OfflineLead>;
  opportunities!: Table<OfflineOpportunity>;
  pendingMutations!: Table<PendingMutation>;

  constructor() {
    super('OptiCRM_Offline');

    this.version(1).stores({
      accounts:         'id, name, accountType, societeAffectation, categorieClient',
      contacts:         'id, firstName, lastName, accountId',
      leads:            'id, firstName, lastName, status',
      opportunities:    'id, name, stage, accountId',
      pendingMutations: '++id, method, url, createdAt',
    });

    // V2 : ajout du champ status + métadonnées de conflit
    this.version(2).stores({
      accounts:         'id, name, accountType, societeAffectation, categorieClient',
      contacts:         'id, firstName, lastName, accountId',
      leads:            'id, firstName, lastName, status',
      opportunities:    'id, name, stage, accountId',
      pendingMutations: '++id, method, url, createdAt, status',
    }).upgrade(tx => {
      // Migrer les mutations existantes : ajouter status = 'pending'
      return tx.table('pendingMutations').toCollection().modify(mutation => {
        if (!mutation.status) {
          mutation.status = 'pending';
        }
      });
    });
  }
}

export const offlineDb = new OptiCRMOfflineDB();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Enregistre une liste d'entités dans le cache local */
export async function cacheEntities<T extends { id: string }>(
  table: Table<T>,
  items: T[]
): Promise<void> {
  await table.bulkPut(items);
}

/** Ajoute une mutation en attente pour synchronisation ultérieure */
export async function queueMutation(
  method: PendingMutation['method'],
  url: string,
  body?: unknown,
  meta?: {
    entityVersion?: number;
    entityType?: string;
    entityId?: string;
  }
): Promise<void> {
  await offlineDb.pendingMutations.add({
    method,
    url,
    body,
    createdAt: Date.now(),
    retries: 0,
    status: 'pending',
    entityVersion: meta?.entityVersion,
    entityType: meta?.entityType,
    entityId: meta?.entityId,
  });
}

/** Retourne le nombre de mutations en attente (pending uniquement) */
export async function getPendingCount(): Promise<number> {
  return offlineDb.pendingMutations.where('status').equals('pending').count();
}

/** Retourne le nombre de conflits non résolus */
export async function getConflictCount(): Promise<number> {
  return offlineDb.pendingMutations.where('status').equals('conflict').count();
}

/** Retourne le nombre de mutations échouées */
export async function getFailedCount(): Promise<number> {
  return offlineDb.pendingMutations.where('status').equals('failed').count();
}

/** Retourne toutes les mutations par statut */
export async function getMutationsByStatus(status: MutationStatus): Promise<PendingMutation[]> {
  return offlineDb.pendingMutations.where('status').equals(status).toArray();
}
