import apiClient from './client';

export interface AgentKey {
  keyId: string;
  keyPrefix: string;
  label: string;
  enabled: boolean;
  lastHeartbeat: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  agentVersion: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface AgentKeyCreated {
  keyId: string;
  rawKey: string;
  keyPrefix: string;
  label: string;
}

export const agentApi = {
  list: (): Promise<AgentKey[]> =>
    apiClient.get('/admin/agent/keys').then(r => r.data.data),

  create: (label: string): Promise<AgentKeyCreated> =>
    apiClient.post('/admin/agent/keys', { label }).then(r => r.data.data),

  revoke: (id: string): Promise<void> =>
    apiClient.delete(`/admin/agent/keys/${id}`).then(() => undefined),
};
