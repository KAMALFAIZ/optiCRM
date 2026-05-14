// ── État de progression de la synchronisation ─────────────────────────────────

export interface SyncProgress {
  phase: 'idle' | 'syncing' | 'done';
  total: number;
  completed: number;
  errors: number;
  conflicts: number;
}

export const INITIAL_SYNC_STATE: SyncProgress = {
  phase: 'idle',
  total: 0,
  completed: 0,
  errors: 0,
  conflicts: 0,
};

type SyncListener = (progress: SyncProgress) => void;

class SyncEmitter {
  private listeners: Set<SyncListener> = new Set();
  private _current: SyncProgress = { ...INITIAL_SYNC_STATE };

  get current(): SyncProgress {
    return this._current;
  }

  emit(progress: SyncProgress): void {
    this._current = progress;
    this.listeners.forEach(fn => fn(progress));
  }

  subscribe(fn: SyncListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  reset(): void {
    this._current = { ...INITIAL_SYNC_STATE };
  }
}

export const syncEmitter = new SyncEmitter();
