import apiClient from './client';

export interface SageServerConfig {
  enabled: boolean;
  host: string;
  port: number;
  database: string;
  username: string;
  /** Renvoyé masqué (••••••••) en GET. Ne pas renvoyer le masque en PUT. */
  password: string;
  dossier: string;
  /** Requête SQL personnalisée pour l'import de données */
  customQuery: string;
}

export const sageConfigApi = {
  get: (): Promise<SageServerConfig> =>
    apiClient.get('/settings/sage').then(r => r.data.data),

  save: (config: SageServerConfig): Promise<SageServerConfig> =>
    apiClient.put('/settings/sage', config).then(r => r.data.data),
};
