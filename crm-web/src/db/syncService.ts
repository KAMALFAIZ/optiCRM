import axios from 'axios';
import apiClient from '@/api/client';
import { offlineDb, cacheEntities, type PendingMutation } from './offlineDb';
import { syncEmitter } from './syncState';

// ── Classification des erreurs ───────────────────────────────────────────────

function isConflictError(error: unknown): boolean {
  if (error instanceof Error && (error as Error & { isConflict?: boolean }).isConflict) {
    return true;
  }
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    return true;
  }
  return false;
}

function isTransientError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return !status || status >= 500 || status === 429;
  }
  // Erreurs réseau = transient
  return !isConflictError(error);
}

function isPermanentError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 400 || status === 403 || status === 404 || status === 422;
  }
  return false;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as { error?: { message?: string } };
    return apiError?.error?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Erreur inconnue';
}

function getServerData(error: unknown): unknown {
  if (error instanceof Error) {
    return (error as Error & { serverData?: unknown }).serverData;
  }
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { data?: unknown })?.data;
  }
  return undefined;
}

// ── Synchronisation des mutations en attente ──────────────────────────────────

const MAX_TRANSIENT_RETRIES = 8;
const MAX_BACKOFF_MS = 30000;

/**
 * Rejoue toutes les mutations en attente vers l'API.
 * Appelé automatiquement au retour du réseau.
 */
export async function syncPendingMutations(): Promise<void> {
  const mutations = await offlineDb.pendingMutations
    .where('status').equals('pending')
    .sortBy('createdAt');

  if (mutations.length === 0) return;

  syncEmitter.emit({ phase: 'syncing', total: mutations.length, completed: 0, errors: 0, conflicts: 0 });

  let completed = 0;
  let errors = 0;
  let conflicts = 0;

  for (const mutation of mutations) {
    try {
      await replayMutation(mutation);
      await offlineDb.pendingMutations.delete(mutation.id!);
      completed++;
    } catch (error) {
      if (isConflictError(error)) {
        // Conflit de version — marquer pour résolution manuelle
        await offlineDb.pendingMutations.update(mutation.id!, {
          status: 'conflict',
          serverData: getServerData(error),
          errorMessage: getErrorMessage(error),
        });
        conflicts++;
      } else if (isPermanentError(error)) {
        // Erreur permanente (400, 403, 404, 422) — ne pas réessayer
        await offlineDb.pendingMutations.update(mutation.id!, {
          status: 'failed',
          errorMessage: getErrorMessage(error),
        });
        errors++;
      } else if (isTransientError(error)) {
        // Erreur transiente — réessayer avec backoff
        const newRetries = mutation.retries + 1;
        if (newRetries >= MAX_TRANSIENT_RETRIES) {
          await offlineDb.pendingMutations.update(mutation.id!, {
            status: 'failed',
            retries: newRetries,
            errorMessage: `Abandonné après ${MAX_TRANSIENT_RETRIES} tentatives : ${getErrorMessage(error)}`,
          });
          errors++;
        } else {
          await offlineDb.pendingMutations.update(mutation.id!, {
            retries: newRetries,
          });
          // Backoff exponentiel
          const delay = Math.min(1000 * Math.pow(2, newRetries), MAX_BACKOFF_MS);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    syncEmitter.emit({
      phase: 'syncing',
      total: mutations.length,
      completed,
      errors,
      conflicts,
    });
  }

  syncEmitter.emit({ phase: 'done', total: mutations.length, completed, errors, conflicts });
}

async function replayMutation(m: PendingMutation): Promise<void> {
  switch (m.method) {
    case 'POST':   await apiClient.post(m.url, m.body);   break;
    case 'PUT':    await apiClient.put(m.url, m.body);    break;
    case 'PATCH':  await apiClient.patch(m.url, m.body);  break;
    case 'DELETE': await apiClient.delete(m.url);         break;
  }
}

// ── Résolution des conflits ─────────────────────────────────────────────────

/** Résoudre un conflit en gardant les données locales (re-soumission avec version serveur) */
export async function resolveConflictKeepLocal(mutationId: number): Promise<void> {
  const mutation = await offlineDb.pendingMutations.get(mutationId);
  if (!mutation || mutation.status !== 'conflict') return;

  // Extraire la version serveur
  const serverVersion = mutation.serverData && typeof mutation.serverData === 'object'
    ? (mutation.serverData as Record<string, unknown>).version as number
    : undefined;

  if (serverVersion !== undefined && mutation.body && typeof mutation.body === 'object') {
    // Mettre à jour le body avec la version serveur pour passer le check optimistic lock
    (mutation.body as Record<string, unknown>).version = serverVersion;
  }

  // Remettre en pending pour la prochaine sync
  await offlineDb.pendingMutations.update(mutationId, {
    status: 'pending',
    body: mutation.body,
    retries: 0,
    serverData: undefined,
    errorMessage: undefined,
  });
}

/** Résoudre un conflit en utilisant la version serveur (supprimer la mutation locale) */
export async function resolveConflictKeepServer(mutationId: number): Promise<void> {
  await offlineDb.pendingMutations.delete(mutationId);
}

/** Rejeter/supprimer une mutation échouée */
export async function discardFailedMutation(mutationId: number): Promise<void> {
  await offlineDb.pendingMutations.delete(mutationId);
}

/** Retenter une mutation échouée */
export async function retryFailedMutation(mutationId: number): Promise<void> {
  await offlineDb.pendingMutations.update(mutationId, {
    status: 'pending',
    retries: 0,
    errorMessage: undefined,
  });
}

// ── Mise en cache des données lues depuis l'API ───────────────────────────────

export async function cacheAccounts(items: Array<{ id: string; [key: string]: unknown }>): Promise<void> {
  await cacheEntities(offlineDb.accounts as never, items as never);
}

export async function cacheContacts(items: Array<{ id: string; [key: string]: unknown }>): Promise<void> {
  await cacheEntities(offlineDb.contacts as never, items as never);
}

export async function cacheLeads(items: Array<{ id: string; [key: string]: unknown }>): Promise<void> {
  await cacheEntities(offlineDb.leads as never, items as never);
}

export async function cacheOpportunities(items: Array<{ id: string; [key: string]: unknown }>): Promise<void> {
  await cacheEntities(offlineDb.opportunities as never, items as never);
}

// ── Lecture offline depuis IndexedDB ─────────────────────────────────────────

export async function getOfflineAccounts() {
  return offlineDb.accounts.toArray();
}

export async function getOfflineContacts() {
  return offlineDb.contacts.toArray();
}

export async function getOfflineLeads() {
  return offlineDb.leads.toArray();
}

export async function getOfflineOpportunities() {
  return offlineDb.opportunities.toArray();
}
