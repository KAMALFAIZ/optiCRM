/**
 * useOfflineSync — queue d'actions offline + synchronisation automatique
 *
 * Stocke les actions delivery (create ligne, create commande…) dans IndexedDB
 * quand le réseau est indisponible et les synchronise dès la reconnexion.
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/client';

const DB_NAME    = 'opticrm-offline';
const DB_VERSION = 1;
const STORE      = 'delivery-queue';

export interface OfflineAction {
  id?: number;
  type: string;          // 'CREATE_LINE' | 'CREATE_PREORDER' | 'TRACK_GPS' …
  endpoint: string;      // URL relative ex: '/delivery/line'
  method: string;        // 'POST' | 'PUT' | 'DELETE'
  payload: object;
  timestamp: number;
  synced: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function queueAction(action: Omit<OfflineAction, 'id' | 'synced' | 'timestamp'>) {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  store.add({ ...action, timestamp: Date.now(), synced: false });
}

async function getPendingActions(): Promise<OfflineAction[]> {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as OfflineAction[]).filter(a => !a.synced));
    req.onerror   = () => reject(req.error);
  });
}

async function markSynced(id: number) {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const req   = store.get(id);
  req.onsuccess = () => {
    const record = req.result;
    if (record) { record.synced = true; store.put(record); }
  };
}

async function clearSynced() {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const req   = store.getAll();
  req.onsuccess = () => {
    (req.result as OfflineAction[])
      .filter(a => a.synced)
      .forEach(a => store.delete(a.id!));
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOfflineSync() {
  const [isOnline, setIsOnline]     = useState(navigator.onLine);
  const [pendingCount, setPending]  = useState(0);
  const [syncing, setSyncing]       = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const actions = await getPendingActions();
      setPending(actions.length);
    } catch { /* IndexedDB non dispo */ }
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      const actions = await getPendingActions();
      for (const action of actions) {
        try {
          if (action.method === 'POST')
            await apiClient.post(action.endpoint, action.payload);
          else if (action.method === 'PUT')
            await apiClient.put(action.endpoint, action.payload);
          else if (action.method === 'DELETE')
            await apiClient.delete(action.endpoint);
          await markSynced(action.id!);
        } catch { /* ignore — retry next time */ }
      }
      await clearSynced();
      await refreshCount();
    } finally { setSyncing(false); }
  }, [syncing, refreshCount]);

  useEffect(() => {
    refreshCount();
    const onOnline  = () => { setIsOnline(true);  syncNow(); };
    const onOffline = () => { setIsOnline(false); };
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [refreshCount, syncNow]);

  return {
    isOnline,
    pendingCount,
    syncing,
    syncNow,
    queueAction,   // exposé pour les composants qui veulent queuer une action
  };
}
