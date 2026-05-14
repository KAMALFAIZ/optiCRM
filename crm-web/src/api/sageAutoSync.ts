import apiClient from './client';
import type { SageSyncRequestDto } from './sageIntegration';

export interface SageAutoSyncConfig {
  enabled: boolean;
  interval: 'HOURLY' | 'DAILY' | 'WEEKLY';
  syncAccounts: boolean;
  syncContacts: boolean;
  lastRunAt: string;
  lastRunStatus: string;
}

export const sageAutoSyncApi = {
  getConfig: (): Promise<SageAutoSyncConfig> =>
    apiClient.get('/sage/auto-sync/config').then(r => r.data.data),

  saveConfig: (cfg: Partial<SageAutoSyncConfig>): Promise<SageAutoSyncConfig> =>
    apiClient.put('/sage/auto-sync/config', cfg).then(r => r.data.data),

  triggerAll: (): Promise<string> =>
    apiClient.post('/sage/auto-sync/trigger').then(r => r.data.data),

  triggerOne: (entityType: string): Promise<SageSyncRequestDto> =>
    apiClient.post(`/sage/auto-sync/trigger/${entityType}`).then(r => r.data.data),
};
